<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectTimeline;
use Illuminate\Http\Request;

class ProjectTimelineController extends Controller
{
    public function index(Project $project)
{
    $timelines = $project->timelines()
        ->withCount('requirements')
        ->orderBy('start_date')
        ->limit(100) // tambah limit
        ->get();

    return response()->json($timelines);
}

    public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
            'priority'    => 'in:rendah,sedang,penting,mendesak',
        ]);

        $validated['duration_days'] = now()->parse($validated['start_date'])
            ->diffInDays($validated['end_date']);

        $timeline = $project->timelines()->create([
            ...$validated,
            'created_by' => auth()->id(),
        ]);

        return response()->json($timeline, 201);
    }

    public function show(Project $project, ProjectTimeline $timeline)
    {
        $timeline->load('requirements.assignedUser');

        return response()->json($timeline);
    }

    public function update(Request $request, Project $project, ProjectTimeline $timeline)
    {
        $validated = $request->validate([
            'title'               => 'sometimes|string|max:255',
            'description'         => 'nullable|string',
            'start_date'          => 'sometimes|date',
            'end_date'            => 'sometimes|date|after_or_equal:start_date',
            'priority'            => 'in:rendah,sedang,penting,mendesak',
            'status'              => 'in:pending,in_progress,completed,overdue',
            'progress_percentage' => 'integer|min:0|max:100',
        ]);

        $timeline->update($validated);
        $timeline->project->recalculateProgress();

        return response()->json($timeline);
    }

    public function destroy(Project $project, ProjectTimeline $timeline)
    {
        $timeline->delete();
        $project->recalculateProgress();

        return response()->json(['message' => 'Timeline berhasil dihapus.']);
    }
}