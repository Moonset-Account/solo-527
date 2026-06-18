<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->string('title');
            $table->text('content')->nullable();
            $table->enum('type', ['alert', 'escalation', 'duty', 'system', 'approval', 'inspection'])->default('alert');
            $table->enum('level', ['info', 'warning', 'critical'])->default('info');
            $table->string('notifiable_type')->nullable();
            $table->unsignedBigInteger('notifiable_id')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->json('channels')->nullable();
            $table->text('metadata')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'read_at']);
            $table->index(['type', 'created_at']);
            $table->index(['notifiable_type', 'notifiable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
