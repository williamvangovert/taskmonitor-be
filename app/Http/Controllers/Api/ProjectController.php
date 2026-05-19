<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Project::with([
            'creator:id,name,email',
            'timelines:id,project_id,title,status,end_date'
        ])->withCount('timelines');

        if ($request->has('status') && $request->status !== 'all') {
            if ($request->status === 'overdue') {
                $query->where('end_date', '<', now())->where('status', '!=', 'completed');
            } else {
                $query->where('status', $request->status);
            }
        }

        $projects = $query->orderByDesc('created_at')->paginate(10);

        return response()->json($projects);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
            'priority'    => 'in:rendah,sedang,penting,mendesak',
            'status'      => 'in:pending,in_progress,completed,archived',
        ]);

        $project = Project::create([
            ...$validated,
            'created_by' => auth()->id(),
        ]);

        return response()->json($project, 201);
    }

    public function show(Project $project)
    {
        $project->load([
            'creator:id,name,email',
            'timelines.requirements'
        ]);

        return response()->json($project);
    }

    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'title'               => 'sometimes|string|max:255',
            'description'         => 'nullable|string',
            'start_date'          => 'sometimes|date',
            'end_date'            => 'sometimes|date|after_or_equal:start_date',
            'priority'            => 'in:rendah,sedang,penting,mendesak',
            'status'              => 'in:pending,in_progress,completed,archived',
            'progress_percentage' => 'integer|min:0|max:100',
        ]);

        $project->update($validated);

        return response()->json($project);
    }

    public function destroy(Project $project)
    {
        $project->delete();

        return response()->json(['message' => 'Project berhasil dihapus.']);
    }
}