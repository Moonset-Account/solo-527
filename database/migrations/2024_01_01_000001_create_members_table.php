<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->onDelete('cascade');
            $table->string('member_no')->unique()->nullable();
            $table->string('gender')->nullable();
            $table->date('birthday')->nullable();
            $table->decimal('height', 5, 2)->nullable();
            $table->decimal('weight', 5, 2)->nullable();
            $table->text('fitness_goal')->nullable();
            $table->text('health_condition')->nullable();
            $table->text('health_notes')->nullable();
            $table->string('emergency_contact')->nullable();
            $table->text('notes')->nullable();
            $table->date('join_date')->nullable();
            $table->date('expire_date')->nullable();
            $table->integer('total_lessons')->default(0);
            $table->integer('used_lessons')->default(0);
            $table->integer('remaining_lessons')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
