<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('timeline_requirements', function (Blueprint $table) {
        $table->id();
        $table->foreignId('timeline_id')
              ->constrained('project_timelines')
              ->cascadeOnDelete();
        $table->string('title');
        $table->text('description')->nullable();
        $table->foreignId('assigned_to')
              ->nullable()
              ->constrained('users')
              ->nullOnDelete();
        $table->date('start_date')->nullable();
        $table->date('end_date')->nullable();
        $table->date('due_date');
        $table->unsignedSmallInteger('duration_days')->default(0);
        $table->unsignedTinyInteger('progress_percentage')->default(0);
        $table->enum('priority', ['rendah', 'sedang', 'penting', 'mendesak'])
              ->default('sedang');
        $table->enum('status', ['pending', 'in_progress', 'review', 'completed', 'overdue'])
              ->default('pending');
        $table->boolean('is_completed')->default(false);
        $table->timestamp('completed_at')->nullable();
        $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('timeline_requirements');
}
};
