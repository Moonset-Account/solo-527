<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practice_recordings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('assignment_id');
            $table->string('file_path', 500);
            $table->integer('duration_seconds');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('assignment_id')->references('id')->on('assignments')->onDelete('cascade');

            $table->index('student_id', 'idx_recordings_student');
            $table->index('assignment_id', 'idx_recordings_assignment');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_recordings');
    }
};
