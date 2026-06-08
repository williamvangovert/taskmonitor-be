<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectTimeline;
use App\Models\TimelineRequirement;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function stats()
    {
        return Cache::remember('dashboard_stats', 60, function () {
            $statusCounts = TimelineRequirement::selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status')
                ->all();

            $priorityCounts = TimelineRequirement::selectRaw('priority, count(*) as count')
                ->groupBy('priority')
                ->pluck('count', 'priority')
                ->all();

            $total = TimelineRequirement::count();
            $completed = TimelineRequirement::where('is_completed', true)->count();
            
            $upcoming = TimelineRequirement::where('is_completed', false)
                ->whereBetween('due_date', [now(), now()->addDays(30)])
                ->count();

            $critical = TimelineRequirement::where('is_completed', false)
                ->whereBetween('due_date', [now(), now()->addDays(2)])
                ->count();

            $overdueCount = TimelineRequirement::where(function ($q) {
                $q->where('status', 'overdue')
                  ->orWhere(function ($q) {
                      $q->where('is_completed', false)
                        ->where('due_date', '<', now());
                  });
            })->count();

            $rate = $total > 0 ? round($completed / $total * 100) : 0;

            return response()->json([
                'total_projects'      => Project::count(),
                'active_timelines'    => ProjectTimeline::whereIn('status', ['pending', 'in_progress'])->count(),
                'total_requirements'  => $total,
                'overdue_count'       => $overdueCount,
                'upcoming_deadlines'  => $upcoming,
                'critical_deadlines'  => $critical,
                'completion_rate'     => $rate,
                'active_users'        => User::where('updated_at', '>=', now()->subDays(7))->count(),
                'status_distribution' => [
                    'pending'     => $statusCounts['pending'] ?? 0,
                    'in_progress' => $statusCounts['in_progress'] ?? 0,
                    'completed'   => $statusCounts['completed'] ?? 0,
                    'overdue'     => $statusCounts['overdue'] ?? 0,
                ],
                'priority_distribution' => [
                    'rendah'   => $priorityCounts['rendah'] ?? 0,
                    'sedang'   => $priorityCounts['sedang'] ?? 0,
                    'penting'  => $priorityCounts['penting'] ?? 0,
                    'mendesak' => $priorityCounts['mendesak'] ?? 0,
                ]
            ]);
        });
    }

    public function overdue()
    {
        return Cache::remember('dashboard_overdue', 60, function () {
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
        });
    }

    public function upcoming()
    {
        return Cache::remember('dashboard_upcoming', 60, function () {
            $upcoming = TimelineRequirement::with([
                'timeline:id,project_id,title',
                'timeline.project:id,title',
                'assignedUser:id,name,email'
            ])
                ->whereBetween('due_date', [now(), now()->addDays(30)])
                ->where('is_completed', false)
                ->orderBy('due_date')
                ->limit(50) // ambil 50 saja
                ->get()
                ->map(function ($req) {
                    $req->days_until = (int) now()->startOfDay()->diffInDays(\Carbon\Carbon::parse($req->due_date)->startOfDay());
                    return $req;
                });

            return response()->json($upcoming);
        });
    }

    public function critical()
    {
        return Cache::remember('dashboard_critical', 60, function () {
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
        });
    }
}