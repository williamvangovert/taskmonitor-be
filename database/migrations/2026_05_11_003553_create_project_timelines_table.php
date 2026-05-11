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
    Schema::create('project_timelines', function (Blueprint $table) {
        $table->id();
        $table->foreignId('project_id')
              ->constrained('projects')
              ->cascadeOnDelete();
        $table->string('title');
        $table->text('description')->nullable();
        $table->date('start_date');
        $table->date('end_date');
        $table->unsignedSmallInteger('duration_days')->default(0);
        $table->enum('priority', ['rendah', 'sedang', 'penting', 'mendesak'])
              ->default('sedang');
        $table->unsignedTinyInteger('progress_percentage')->default(0);
        $table->enum('status', ['pending', 'in_progress', 'completed', 'overdue'])
              ->default('pending');
        $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('project_timelines');
}
};
