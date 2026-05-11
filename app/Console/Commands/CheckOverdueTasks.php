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
            ->get();

        foreach ($overdueTasks as $task) {
            $task->update(['status' => 'overdue']);

            if ($task->assigned_to) {
                Notification::create([
                    'user_id' => $task->assigned_to,
                    'title'   => 'Tugas Terlambat',
                    'message' => "Tugas '{$task->title}' telah melewati batas waktu (Deadline: {$task->due_date->format('d M Y')}).",
                    'type'    => 'overdue',
                ]);
            }
            
            $this->info("Task marked as overdue: {$task->title}");
        }

        $this->info('Overdue tasks check completed.');
    }
}
