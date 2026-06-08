<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['timeline_id', 'title', 'description', 'assigned_to', 'start_date', 'end_date', 'due_date', 'duration_days', 'progress_percentage', 'priority', 'status', 'is_completed', 'completed_at', 'created_by', 'pic'])]
class TimelineRequirement extends Model
{
    protected $casts = [
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
    ];

    public function timeline(): BelongsTo
    {
        return $this->belongsTo(ProjectTimeline::class, 'timeline_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
