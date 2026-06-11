<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('api_failure_logs', function (Blueprint $table) {
            $table->id();
            $table->enum('api_type', ['payment', 'message']);
            $table->enum('channel', ['alipay', 'wechat', 'sms', 'push']);
            $table->string('order_no')->nullable();
            $table->json('request_payload')->nullable();
            $table->string('error_message');
            $table->string('error_code')->nullable();
            $table->json('impact_scope')->nullable();
            $table->unsignedInteger('retry_count')->default(0);
            $table->timestamp('last_retry_at')->nullable();
            $table->enum('status', ['pending', 'retrying', 'resolved', 'failed'])->default('pending');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('created_at');

            $table->index('api_type');
            $table->index('channel');
            $table->index('order_no');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_failure_logs');
    }
};
