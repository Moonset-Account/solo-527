<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('annotations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('teacher_user_id');
            $table->unsignedBigInteger('practice_recording_id');
            $table->integer('timestamp_ms');
            $table->text('content');
            $table->timestamps();

            $table->foreign('teacher_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('practice_recording_id')->references('id')->on('practice_recordings')->onDelete('cascade');

            $table->index('teacher_user_id', 'idx_annotations_teacher');
            $table->index('practice_recording_id', 'idx_annotations_recording');
            $table->index('timestamp_ms', 'idx_annotations_timestamp');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('annotations');
    }
};
