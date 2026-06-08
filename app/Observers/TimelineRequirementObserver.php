<?php

namespace App\Observers;

use App\Models\TimelineRequirement;
use Illuminate\Support\Facades\Cache;

class TimelineRequirementObserver
{
    /**
     * Handle the TimelineRequirement "saved" event.
     */
    public function saved(TimelineRequirement $timelineRequirement): void
    {
        if ($timelineRequirement->timeline) {
            $timelineRequirement->timeline->recalculateProgress();
            Cache::forget('dashboard_stats');
        }
    }

    /**
     * Handle the TimelineRequirement "deleted" event.
     */
    public function deleted(TimelineRequirement $timelineRequirement): void
    {
        if ($timelineRequirement->timeline) {
            $timelineRequirement->timeline->recalculateProgress();
            Cache::forget('dashboard_stats');
        }
    }
}
