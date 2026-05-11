<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index()
    {
        $projects = Project::with(['creator', 'timelines'])
            ->withCount('timelines')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($projects);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after:start_date',
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
        $project->load(['creator', 'timelines.requirements']);

        return response()->json($project);
    }

    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'title'               => 'sometimes|string|max:255',
            'description'         => 'nullable|string',
            'start_date'          => 'sometimes|date',
            'end_date'            => 'sometimes|date|after:start_date',
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