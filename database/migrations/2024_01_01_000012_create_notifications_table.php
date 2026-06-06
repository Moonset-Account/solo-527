<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->string('channel')->nullable();
            $table->string('status')->default('pending')->comment('pending:待发送,sent:已发送,failed:发送失败');
            $table->integer('retry_count')->default(0);
            $table->integer('max_retries')->default(3);
            $table->timestamp('last_retry_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
            $table->index(['notifiable_type', 'notifiable_id', 'status']);
            $table->index(['status', 'created_at']);
        });

        Schema::create('notification_logs', function (Blueprint $table) {
            $table->id();
            $table->uuid('notification_id')->nullable();
            $table->string('channel');
            $table->string('recipient');
            $table->string('subject')->nullable();
            $table->text('content')->nullable();
            $table->string('status')->default('pending');
            $table->text('error_message')->nullable();
            $table->integer('retry_attempt')->default(0);
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            $table->index(['notification_id', 'status']);
            $table->index(['channel', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_logs');
        Schema::dropIfExists('notifications');
    }
};
