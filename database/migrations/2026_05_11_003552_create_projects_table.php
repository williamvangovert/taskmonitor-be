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
    Schema::create('projects', function (Blueprint $table) {
        $table->id();
        $table->string('title');
        $table->text('description')->nullable();
        $table->date('start_date');
        $table->date('end_date');
        $table->enum('priority', ['rendah', 'sedang', 'penting', 'mendesak'])
              ->default('sedang');
        $table->unsignedTinyInteger('progress_percentage')->default(0);
        $table->enum('status', ['pending', 'in_progress', 'completed', 'archived'])
              ->default('pending');
        $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('projects');
}
};
