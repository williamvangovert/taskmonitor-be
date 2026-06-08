<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['project_id', 'title', 'description', 'start_date', 'end_date', 'duration_days', 'priority', 'progress_percentage', 'status', 'created_by'])]
class ProjectTimeline extends Model
{
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function requirements(): HasMany
    {
        return $this->hasMany(TimelineRequirement::class, 'timeline_id');
    }

    public function recalculateProgress(): void
    {
        $stats = $this->requirements()
            ->selectRaw('COUNT(*) as total, AVG(progress_percentage) as avg_progress')
            ->first();

        $this->update([
            'progress_percentage' => ($stats->total > 0)
                ? (int) round($stats->avg_progress)
                : 0
        ]);

        if ($this->project) {
            $this->project->recalculateProgress();
        }
    }
}
