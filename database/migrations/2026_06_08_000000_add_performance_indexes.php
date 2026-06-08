<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('timeline_requirements', function (Blueprint $table) {
            $table->index('status');
            $table->index('due_date');
            $table->index('is_completed');
            $table->index(['timeline_id', 'status'], 'tr_timeline_status_idx');
            $table->index(['assigned_to', 'is_completed'], 'tr_assigned_completed_idx');
            $table->index(['due_date', 'is_completed'], 'tr_due_completed_idx');
        });

        Schema::table('project_timelines', function (Blueprint $table) {
            $table->index(['project_id', 'status'], 'pt_project_status_idx');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['user_id', 'is_read'], 'notif_user_read_idx');
        });
    }

    public function down(): void
    {
        Schema::table('timeline_requirements', function (Blueprint $table) {
            $table->dropIndex('tr_timeline_status_idx');
            $table->dropIndex('tr_assigned_completed_idx');
            $table->dropIndex('tr_due_completed_idx');
            $table->dropIndex(['status']);
            $table->dropIndex(['due_date']);
            $table->dropIndex(['is_completed']);
        });

        Schema::table('project_timelines', function (Blueprint $table) {
            $table->dropIndex('pt_project_status_idx');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('notif_user_read_idx');
        });
    }
};
