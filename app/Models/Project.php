<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['title', 'description', 'start_date', 'end_date', 'priority', 'progress_percentage', 'status', 'created_by', 'pic'])]
class Project extends Model
{
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function timelines(): HasMany
    {
        return $this->hasMany(ProjectTimeline::class);
    }

    public function requirements(): \Illuminate\Database\Eloquent\Relations\HasManyThrough
    {
        return $this->hasManyThrough(TimelineRequirement::class, ProjectTimeline::class, 'project_id', 'timeline_id');
    }

    public function recalculateProgress(): void
    {
        $stats = $this->timelines()
            ->selectRaw('COUNT(*) as total, AVG(progress_percentage) as avg_progress, SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed_count, SUM(CASE WHEN status != "pending" THEN 1 ELSE 0 END) as not_pending_count')
            ->first();

        $progress = ($stats->total > 0)
            ? (int) round($stats->avg_progress)
            : 0;
            
        $updateData = ['progress_percentage' => $progress];

        if ($stats->total > 0) {
            if ((int)$stats->completed_count === (int)$stats->total) {
                $updateData['status'] = 'completed';
            } elseif ((int)$stats->not_pending_count > 0) {
                if ($this->status === 'pending') {
                    $updateData['status'] = 'in_progress';
                } elseif ($this->status === 'completed') {
                    $updateData['status'] = 'in_progress';
                }
            }
        }

        $this->update($updateData);
    }
}
