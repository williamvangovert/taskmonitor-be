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
    $data = Cache::remember('dashboard_stats', 60, function () {
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

        return [
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
        ];
    });

    return response()->json($data);
}

public function overdue()
{
    $data = Cache::remember('dashboard_overdue', 60, function () {
        return TimelineRequirement::with([
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
            ->limit(50)
            ->get()
            ->map(function ($req) {
                $req->days_late = (int) now()->startOfDay()->diffInDays(\Carbon\Carbon::parse($req->due_date)->startOfDay());
                return $req;
            })
            ->toArray(); // ✅ Convert ke array
    });

    return response()->json($data);
}

public function upcoming()
{
    $data = Cache::remember('dashboard_upcoming', 60, function () {
        return TimelineRequirement::with([
            'timeline:id,project_id,title',
            'timeline.project:id,title',
            'assignedUser:id,name,email'
        ])
            ->whereBetween('due_date', [now(), now()->addDays(30)])
            ->where('is_completed', false)
            ->orderBy('due_date')
            ->limit(50)
            ->get()
            ->map(function ($req) {
                $req->days_until = (int) now()->startOfDay()->diffInDays(\Carbon\Carbon::parse($req->due_date)->startOfDay());
                return $req;
            })
            ->toArray(); // ✅ Convert ke array
    });

    return response()->json($data);
}

public function critical()
{
    $data = Cache::remember('dashboard_critical', 60, function () {
        return TimelineRequirement::with([
            'timeline:id,project_id,title',
            'timeline.project:id,title',
            'assignedUser:id,name,email'
        ])
            ->whereBetween('due_date', [now(), now()->addDays(2)])
            ->where('is_completed', false)
            ->orderBy('due_date')
            ->limit(20)
            ->get()
            ->map(function ($req) {
                $req->days_until = (int) now()->startOfDay()->diffInDays(\Carbon\Carbon::parse($req->due_date)->startOfDay());
                return $req;
            })
            ->toArray(); // ✅ Convert ke array
    });

    return response()->json($data);
}

public function picPerformance()
{
    $data = Cache::remember('dashboard_pic_performance', 60, function () {
        $pics = [];

        $requirements = DB::table('timeline_requirements as r')
            ->join('project_timelines as t', 'r.timeline_id', '=', 't.id')
            ->join('projects as p', 't.project_id', '=', 'p.id')
            ->whereNotNull('r.pic')
            ->where('r.pic', '!=', '')
            ->select(
                'r.id',
                'r.pic',
                'r.title',
                'r.status',
                'r.due_date',
                'r.timeline_id',
                't.title as timeline_title',
                'p.id as project_id',
                'p.title as project_title'
            )
            ->orderBy('r.due_date')
            ->get();

        foreach ($requirements as $row) {
            $picName = trim(ucwords(strtolower($row->pic)));
            if (empty($picName)) continue;

            if (!isset($pics[$picName])) {
                $pics[$picName] = [
                    'name'          => $picName,
                    'total'         => 0,
                    'completed'     => 0,
                    'not_completed' => 0,
                    'tasks_completed'     => [],
                    'tasks_not_completed' => [],
                ];
            }

            $taskEntry = [
                'id'             => $row->id,
                'title'          => $row->title,
                'status'         => $row->status,
                'due_date'       => $row->due_date,
                'timeline_id'    => $row->timeline_id,
                'timeline_title' => $row->timeline_title,
                'project_id'     => $row->project_id,
                'project_title'  => $row->project_title,
            ];

            $pics[$picName]['total']++;
            if ($row->status === 'completed') {
                $pics[$picName]['completed']++;
                $pics[$picName]['tasks_completed'][] = $taskEntry;
            } else {
                $pics[$picName]['not_completed']++;
                $pics[$picName]['tasks_not_completed'][] = $taskEntry;
            }
        }

        $result = array_values($pics);
        usort($result, function($a, $b) {
            return $b['total'] <=> $a['total'];
        });

        return $result;
    });

    return response()->json($data);
}
}