<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\TimelineRequirement;
use Illuminate\Console\Command;

class CheckOverdueTasks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-overdue-tasks';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for tasks that have passed their deadline and mark them as overdue';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $overdueTasks = TimelineRequirement::where('is_completed', false)
            ->where('due_date', '<', now())
            ->where('status', '!=', 'overdue')
            ->get(['id', 'title', 'due_date', 'assigned_to']);

        if ($overdueTasks->isEmpty()) {
            $this->info('No overdue tasks found.');
            return;
        }

        // Bulk update status in 1 query
        TimelineRequirement::whereIn('id', $overdueTasks->pluck('id'))
            ->update(['status' => 'overdue']);

        // Bulk insert notifications in 1 query
        $notifications = $overdueTasks
            ->filter(fn($task) => $task->assigned_to)
            ->map(fn($task) => [
                'user_id'    => $task->assigned_to,
                'title'      => 'Tugas Terlambat',
                'message'    => "Tugas '{$task->title}' telah melewati batas waktu (Deadline: {$task->due_date->format('d M Y')}).",
                'type'       => 'overdue',
                'is_read'    => false,
                'created_at' => now(),
                'updated_at' => now(),
            ])
            ->values()
            ->all();

        if (!empty($notifications)) {
            Notification::insert($notifications);
        }

        $this->info("Marked {$overdueTasks->count()} tasks as overdue.");
    }
}
