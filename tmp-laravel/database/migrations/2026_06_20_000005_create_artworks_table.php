<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('artworks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students');
            $table->foreignId('art_class_id')->constrained('art_classes');
            $table->foreignId('teacher_id')->constrained('users');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('image_path');
            $table->timestamp('submitted_at');
            $table->enum('status', ['pending', 'reviewed', 'revision'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('artworks');
    }
};
