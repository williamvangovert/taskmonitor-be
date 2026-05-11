<?php

namespace App\Observers;

use App\Models\TimelineRequirement;

class TimelineRequirementObserver
{
    /**
     * Handle the TimelineRequirement "saved" event.
     */
    public function saved(TimelineRequirement $timelineRequirement): void
    {
        if ($timelineRequirement->timeline) {
            $timelineRequirement->timeline->recalculateProgress();
        }
    }

    /**
     * Handle the TimelineRequirement "deleted" event.
     */
    public function deleted(TimelineRequirement $timelineRequirement): void
    {
        if ($timelineRequirement->timeline) {
            $timelineRequirement->timeline->recalculateProgress();
        }
    }
}
