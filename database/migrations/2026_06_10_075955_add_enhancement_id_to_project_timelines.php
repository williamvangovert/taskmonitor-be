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
        Schema::table('project_timelines', function (Blueprint $table) {
            $table->foreignId('enhancement_id')->nullable()->after('project_id')->constrained('project_enhancements')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_timelines', function (Blueprint $table) {
            $table->dropForeign(['enhancement_id']);
            $table->dropColumn('enhancement_id');
        });
    }
};
