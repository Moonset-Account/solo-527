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
            $table->string('type')->comment('通知类型');
            $table->text('content')->comment('通知内容');
            $table->string('status')->default('pending')->comment('状态');
            $table->text('failure_reason')->nullable()->comment('失败原因');
            $table->integer('retry_count')->default(0)->comment('重试次数');
            $table->string('recipient')->comment('接收人');
            $table->string('channel')->nullable()->comment('发送渠道');
            $table->dateTime('sent_at')->nullable()->comment('发送时间');
            $table->text('metadata')->nullable()->comment('元数据');
            $table->softDeletes();
            $table->timestamps();

            $table->index('type');
            $table->index('status');
            $table->index('recipient');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
