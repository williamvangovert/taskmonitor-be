<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectTimeline;
use App\Models\TimelineRequirement;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats()
    {
        // Gabungkan semua count dalam 1 query saja
        $reqStats = TimelineRequirement::selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN is_completed = true THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as status_completed,
            SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue,
            SUM(CASE WHEN priority = 'rendah' THEN 1 ELSE 0 END) as rendah,
            SUM(CASE WHEN priority = 'sedang' THEN 1 ELSE 0 END) as sedang,
            SUM(CASE WHEN priority = 'penting' THEN 1 ELSE 0 END) as penting,
            SUM(CASE WHEN priority = 'mendesak' THEN 1 ELSE 0 END) as mendesak,
            SUM(CASE WHEN due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days' AND is_completed = false THEN 1 ELSE 0 END) as upcoming,
            SUM(CASE WHEN due_date BETWEEN NOW() AND NOW() + INTERVAL '2 days' AND is_completed = false THEN 1 ELSE 0 END) as critical,
            SUM(CASE WHEN (status = 'overdue' OR (is_completed = false AND due_date < NOW())) THEN 1 ELSE 0 END) as overdue_count
        ")->first();

        $rate = $reqStats->total > 0
            ? round($reqStats->completed / $reqStats->total * 100)
            : 0;

        return response()->json([
            'total_projects'      => Project::count(),
            'active_timelines'    => ProjectTimeline::whereIn('status', ['pending', 'in_progress'])->count(),
            'total_requirements'  => $reqStats->total,
            'overdue_count'       => $reqStats->overdue_count,
            'upcoming_deadlines'  => $reqStats->upcoming,
            'critical_deadlines'  => $reqStats->critical,
            'completion_rate'     => $rate,
            'active_users'        => User::where('updated_at', '>=', now()->subDays(7))->count(),
            'status_distribution' => [
                'pending'     => $reqStats->pending,
                'in_progress' => $reqStats->in_progress,
                'completed'   => $reqStats->status_completed,
                'overdue'     => $reqStats->overdue,
            ],
            'priority_distribution' => [
                'rendah'   => $reqStats->rendah,
                'sedang'   => $reqStats->sedang,
                'penting'  => $reqStats->penting,
                'mendesak' => $reqStats->mendesak,
            ]
        ]);
    }

    public function overdue()
    {
        $overdue = TimelineRequirement::with([
            'timeline:id,project_id,title',
            'timeline.project:id,title',
            'assignedUser:id,name,email'
        ])
            ->where(function ($q) {
                $q->where('status', 'overdue')
                  ->orWhere(function ($q) {
                      $q->where('is_completed', false)
                        ->where('due_date', '<', now());
                  });
            })
            ->orderBy('due_date')
            ->limit(50) // ambil 50 saja
            ->get()
            ->map(function ($req) {
                $req->days_late = (int) now()->startOfDay()->diffInDays(\Carbon\Carbon::parse($req->due_date)->startOfDay());
                return $req;
            });

        return response()->json($overdue);
    }

    public function upcoming()
    {
        $upcoming = TimelineRequirement::with([
            'timeline:id,project_id,title',
            'timeline.project:id,title',
            'assignedUser:id,name,email'
        ])
            ->whereBetween('due_date', [now(), now()->addDays(7)])
            ->where('is_completed', false)
            ->orderBy('due_date')
            ->limit(50) // ambil 50 saja
            ->get()
            ->map(function ($req) {
                $req->days_until = (int) now()->startOfDay()->diffInDays(\Carbon\Carbon::parse($req->due_date)->startOfDay());
                return $req;
            });

        return response()->json($upcoming);
    }

    public function critical()
    {
        $critical = TimelineRequirement::with([
            'timeline:id,project_id,title',
            'timeline.project:id,title',
            'assignedUser:id,name,email'
        ])
            ->whereBetween('due_date', [now(), now()->addDays(2)])
            ->where('is_completed', false)
            ->orderBy('due_date')
            ->limit(20) // ambil 20 saja
            ->get()
            ->map(function ($req) {
                $req->days_until = (int) now()->startOfDay()->diffInDays(\Carbon\Carbon::parse($req->due_date)->startOfDay());
                return $req;
            });

        return response()->json($critical);
    }
}