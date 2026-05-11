<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\TimelineRequirement;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendDeadlineReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-deadline-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send notifications for requirements reaching their deadline';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $tomorrow = Carbon::tomorrow();
        
        $requirements = TimelineRequirement::where('is_completed', false)
            ->whereDate('due_date', $tomorrow)
            ->get();

        foreach ($requirements as $requirement) {
            if ($requirement->assigned_to) {
                Notification::create([
                    'user_id' => $requirement->assigned_to,
                    'title'   => 'Pengingat Tenggat Waktu',
                    'message' => "Tugas '{$requirement->title}' akan segera berakhir besok pada {$requirement->due_date->format('d M Y')}.",
                    'type'    => 'reminder',
                ]);
                
                $this->info("Reminder sent for: {$requirement->title} to user ID: {$requirement->assigned_to}");
            }
        }

        $this->info('Deadline reminders processed successfully.');
    }
}
