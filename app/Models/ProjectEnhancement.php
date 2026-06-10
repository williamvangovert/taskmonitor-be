<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['project_id', 'title', 'description', 'status', 'progress_percentage', 'created_by', 'pic'])]
class ProjectEnhancement extends Model
{
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function timelines(): HasMany
    {
        return $this->hasMany(ProjectTimeline::class, 'enhancement_id');
    }

    public function recalculateProgress(): void
    {
        $stats = $this->timelines()
            ->selectRaw("COUNT(*) as total, AVG(progress_percentage) as avg_progress, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count, SUM(CASE WHEN status != 'pending' THEN 1 ELSE 0 END) as not_pending_count")
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
