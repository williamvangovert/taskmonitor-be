<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['title', 'description', 'start_date', 'end_date', 'priority', 'progress_percentage', 'status', 'created_by'])]
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
            ->selectRaw('COUNT(*) as total, AVG(progress_percentage) as avg_progress')
            ->first();

        $this->update([
            'progress_percentage' => ($stats->total > 0)
                ? (int) round($stats->avg_progress)
                : 0
        ]);
    }
}
