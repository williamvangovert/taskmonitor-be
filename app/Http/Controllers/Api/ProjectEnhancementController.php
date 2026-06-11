<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectEnhancement;
use Illuminate\Http\Request;

class ProjectEnhancementController extends Controller
{
    public function index(Project $project)
    {
        $enhancements = $project->enhancements()
            ->withCount('timelines')
            ->orderBy('created_at')
            ->get();

        return response()->json($enhancements);
    }

    public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'status'      => 'in:pending,in_progress,completed,overdue',
            'pic'         => 'nullable|string|max:255',
        ]);

        $enhancement = $project->enhancements()->create([
            ...$validated,
            'created_by' => auth()->id(),
        ]);

        return response()->json($enhancement, 201);
    }

    public function show(Project $project, ProjectEnhancement $enhancement)
    {
        $enhancement->load([
            'timelines' => function ($q) {
                $q->withCount('requirements')
                  ->orderBy('start_date')
                  ->orderBy('id');
            },
        ]);
        return response()->json($enhancement);
    }

    public function update(Request $request, Project $project, ProjectEnhancement $enhancement)
    {
        $validated = $request->validate([
            'title'               => 'sometimes|string|max:255',
            'description'         => 'nullable|string',
            'status'              => 'in:pending,in_progress,completed,overdue',
            'progress_percentage' => 'integer|min:0|max:100',
            'pic'                 => 'nullable|string|max:255',
        ]);

        $enhancement->update($validated);
        $project->recalculateProgress();

        return response()->json($enhancement);
    }

    public function destroy(Project $project, ProjectEnhancement $enhancement)
    {
        $enhancement->delete();
        $project->recalculateProgress();

        return response()->json(['message' => 'Enhancement berhasil dihapus.']);
    }
}
