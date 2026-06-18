<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('level', ['critical', 'warning', 'info', 'debug'])->default('warning');
            $table->enum('status', ['open', 'acknowledged', 'processing', 'resolved', 'closed'])->default('open');
            $table->string('source')->nullable();
            $table->string('server_ip')->nullable();
            $table->string('service')->nullable();
            $table->string('hostname')->nullable();
            $table->text('tags')->nullable();
            $table->json('metadata')->nullable();
            $table->foreignId('acknowledged_by')->nullable()->constrained('users');
            $table->foreignId('processed_by')->nullable()->constrained('users');
            $table->foreignId('closed_by')->nullable()->constrained('users');
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamp('escalated_at')->nullable();
            $table->integer('escalation_level')->default(0);
            $table->boolean('is_inspected')->default(false);
            $table->timestamp('inspected_at')->nullable();
            $table->foreignId('inspected_by')->nullable()->constrained('users');
            $table->text('resolution')->nullable();
            $table->timestamps();
            $table->index(['status', 'level']);
            $table->index(['created_at']);
            $table->index(['server_ip']);
            $table->index(['is_inspected']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};
