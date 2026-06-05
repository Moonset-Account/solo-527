<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('instrument', 50);
            $table->unsignedBigInteger('parent_user_id')->nullable();
            $table->unsignedBigInteger('teacher_user_id')->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamps();

            $table->foreign('parent_user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('teacher_user_id')->references('id')->on('users')->onDelete('set null');

            $table->index('parent_user_id', 'idx_students_parent');
            $table->index('teacher_user_id', 'idx_students_teacher');
            $table->index('instrument', 'idx_students_instrument');
            $table->index('status', 'idx_students_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
