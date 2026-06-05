<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parent_confirmations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('parent_user_id');
            $table->unsignedBigInteger('assignment_id');
            $table->unsignedBigInteger('student_id');
            $table->boolean('confirmed')->default(false);
            $table->text('note')->nullable();
            $table->timestamps();

            $table->foreign('parent_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('assignment_id')->references('id')->on('assignments')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');

            $table->index('parent_user_id', 'idx_confirmations_parent');
            $table->index('assignment_id', 'idx_confirmations_assignment');
            $table->index('student_id', 'idx_confirmations_student');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parent_confirmations');
    }
};
