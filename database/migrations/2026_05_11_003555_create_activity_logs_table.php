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
    Schema::create('activity_logs', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')
              ->nullable()
              ->constrained('users')
              ->nullOnDelete();
        $table->string('action');
        $table->text('description')->nullable();
        $table->string('loggable_type')->nullable();
        $table->unsignedBigInteger('loggable_id')->nullable();
        $table->index(['loggable_type', 'loggable_id']);
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('activity_logs');
}
};
