<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('participation_stats', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->date('stat_date');
            $table->unsignedInteger('event_count')->default(0);
            $table->unsignedInteger('issue_count')->default(0);
            $table->unsignedInteger('vote_count')->default(0);
            $table->unsignedInteger('assistance_count')->default(0);
            $table->unsignedInteger('todo_count')->default(0);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['user_id', 'stat_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('participation_stats');
    }
};
