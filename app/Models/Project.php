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

    public function recalculateProgress(): void
    {
        $totalTimelines = $this->timelines()->count();
        if ($totalTimelines === 0) {
            $this->update(['progress_percentage' => 0]);
            return;
        }

        $averageProgress = $this->timelines()->avg('progress_percentage');
        $this->update(['progress_percentage' => (int) round($averageProgress)]);
    }
}
