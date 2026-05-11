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
        $total       = TimelineRequirement::count();
        $completed   = TimelineRequirement::where('is_completed', true)->count();
        $rate        = $total > 0 ? round($completed / $total * 100) : 0;

        return response()->json([
            'total_projects'      => Project::count(),
            'active_timelines'    => ProjectTimeline::whereIn('status', ['pending', 'in_progress'])->count(),
            'total_requirements'  => $total,
            'overdue_count'       => TimelineRequirement::where('status', 'overdue')->count(),
            'upcoming_deadlines'  => TimelineRequirement::whereBetween('due_date', [now(), now()->addDays(7)])
                                        ->where('is_completed', false)->count(),
            'completion_rate'     => $rate,
            'active_users'        => User::where('updated_at', '>=', now()->subDays(7))->count(),
        ]);
    }

    public function overdue()
    {
        $overdue = TimelineRequirement::with(['timeline.project', 'assignedUser'])
            ->where('status', 'overdue')
            ->orWhere(function ($q) {
                $q->where('is_completed', false)
                  ->where('due_date', '<', now());
            })
            ->orderBy('due_date')
            ->get()
            ->map(function ($req) {
                $req->days_late = now()->diffInDays($req->due_date);
                return $req;
            });

        return response()->json($overdue);
    }

    public function upcoming()
    {
        $upcoming = TimelineRequirement::with(['timeline.project', 'assignedUser'])
            ->whereBetween('due_date', [now(), now()->addDays(7)])
            ->where('is_completed', false)
            ->orderBy('due_date')
            ->get()
            ->map(function ($req) {
                $req->days_until = now()->diffInDays($req->due_date);
                return $req;
            });

        return response()->json($upcoming);
    }
}