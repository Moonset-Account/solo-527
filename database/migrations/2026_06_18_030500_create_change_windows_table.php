<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('change_windows', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->timestamp('start_time');
            $table->timestamp('end_time');
            $table->enum('type', ['planned', 'emergency', 'routine'])->default('planned');
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled', 'failed'])->default('scheduled');
            $table->string('change_request_id')->nullable();
            $table->text('affected_systems')->nullable();
            $table->text('rollback_plan')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->index(['start_time', 'end_time']);
            $table->index(['status', 'priority']);
            $table->index(['created_by']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('change_windows');
    }
};
