<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedule_conflicts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users');
            $table->foreignId('art_class_id')->constrained('art_classes');
            $table->date('conflict_date');
            $table->enum('conflict_type', ['teacher_overlap', 'room_overlap', 'time_overlap']);
            $table->text('description')->nullable();
            $table->text('resolution')->nullable();
            $table->enum('resolution_status', ['pending', 'resolved', 'ignored'])->default('pending');
            $table->timestamp('notified_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_conflicts');
    }
};
