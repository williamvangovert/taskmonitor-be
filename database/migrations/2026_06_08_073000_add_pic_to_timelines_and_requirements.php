<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_timelines', function (Blueprint $table) {
            $table->string('pic')->nullable();
        });

        Schema::table('timeline_requirements', function (Blueprint $table) {
            $table->string('pic')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('project_timelines', function (Blueprint $table) {
            $table->dropColumn('pic');
        });

        Schema::table('timeline_requirements', function (Blueprint $table) {
            $table->dropColumn('pic');
        });
    }
};
