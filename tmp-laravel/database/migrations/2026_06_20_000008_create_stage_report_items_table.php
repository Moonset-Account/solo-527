<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stage_report_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stage_report_id')->constrained('stage_reports')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->decimal('attendance_rate', 5, 2)->nullable();
            $table->decimal('homework_score', 5, 2)->nullable();
            $table->decimal('artwork_score', 5, 2)->nullable();
            $table->text('teacher_comment')->nullable();
            $table->decimal('overall_score', 5, 2)->nullable();
            $table->integer('rank')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stage_report_items');
    }
};
