<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProjectTimeline;
use App\Models\TimelineRequirement;
use Illuminate\Http\Request;

class TimelineRequirementController extends Controller
{
    public function index(ProjectTimeline $timeline)
{
    $requirements = $timeline->requirements()
        ->with('assignedUser:id,name,email') // ambil kolom spesifik saja
        ->orderBy('due_date')
        ->limit(100) // tambah limit
        ->get();

    return response()->json($requirements);
}

    public function store(Request $request, ProjectTimeline $timeline)
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date',
            'due_date'    => 'required|date',
            'priority'    => 'in:rendah,sedang,penting,mendesak',
            'pic'         => 'nullable|string|max:255',
        ]);

        if (isset($validated['start_date'], $validated['end_date'])) {
            $validated['duration_days'] = now()->parse($validated['start_date'])
                ->diffInDays($validated['end_date']);
        }

        $requirement = $timeline->requirements()->create([
            ...$validated,
            'created_by' => auth()->id(),
        ]);

        $timeline->recalculateProgress();

        return response()->json($requirement, 201);
    }

    public function show(ProjectTimeline $timeline, TimelineRequirement $requirement)
    {
        $requirement->load('assignedUser');

        return response()->json($requirement);
    }

    public function update(Request $request, ProjectTimeline $timeline, TimelineRequirement $requirement)
    {
        $validated = $request->validate([
            'title'               => 'sometimes|string|max:255',
            'description'         => 'nullable|string',
            'assigned_to'         => 'nullable|exists:users,id',
            'start_date'          => 'nullable|date',
            'end_date'            => 'nullable|date',
            'due_date'            => 'sometimes|date',
            'priority'            => 'in:rendah,sedang,penting,mendesak',
            'status'              => 'in:pending,in_progress,completed,overdue',
            'progress_percentage' => 'integer|min:0|max:100',
            'is_completed'        => 'boolean',
            'pic'                 => 'nullable|string|max:255',
        ]);

        if (isset($validated['is_completed']) && $validated['is_completed']) {
            $validated['completed_at']        = now();
            $validated['status']              = 'completed';
            $validated['progress_percentage'] = 100;
        }

        $requirement->update($validated);
        
        $timeline->recalculateProgress();

        return response()->json($requirement);
    }

    public function destroy(ProjectTimeline $timeline, TimelineRequirement $requirement)
    {
        $requirement->delete();
        $timeline->recalculateProgress();
        return response()->json(['message' => 'Requirement berhasil dihapus.']);
    }
}