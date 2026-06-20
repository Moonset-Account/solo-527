<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('art_classes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['素描', '色彩', '速写', '设计']);
            $table->string('level')->nullable();
            $table->foreignId('teacher_id')->constrained('users');
            $table->date('start_date');
            $table->date('end_date');
            $table->json('schedule')->nullable();
            $table->integer('max_students')->default(30);
            $table->enum('status', ['active', 'paused', 'completed'])->default('active');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('art_classes');
    }
};
