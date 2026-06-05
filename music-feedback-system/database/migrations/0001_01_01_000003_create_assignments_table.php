<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('teacher_user_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('piece_id');
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->integer('bpm_requirement')->nullable();
            $table->string('beat_time_signature', 20)->nullable();
            $table->date('due_date')->nullable();
            $table->string('status', 20)->default('draft');
            $table->timestamps();

            $table->foreign('teacher_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('piece_id')->references('id')->on('pieces')->onDelete('cascade');

            $table->index('teacher_user_id', 'idx_assignments_teacher');
            $table->index('student_id', 'idx_assignments_student');
            $table->index('piece_id', 'idx_assignments_piece');
            $table->index('status', 'idx_assignments_status');
            $table->index('due_date', 'idx_assignments_due_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignments');
    }
};
