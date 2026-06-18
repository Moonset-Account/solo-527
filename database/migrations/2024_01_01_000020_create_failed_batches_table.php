<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('failed_batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_id')->unique()->comment('批次ID');
            $table->string('job_type')->comment('任务类型: import, export, notification, sync, other');
            $table->string('name')->nullable()->comment('批次名称');
            $table->text('payload')->nullable()->comment('批次数据(JSON)');
            $table->text('exception')->nullable()->comment('异常信息');
            $table->integer('total_items')->default(0)->comment('总条目数');
            $table->integer('success_count')->default(0)->comment('成功数');
            $table->integer('failed_count')->default(0)->comment('失败数');
            $table->string('status')->default('failed')->comment('状态: pending, processing, failed, partial, completed');
            $table->integer('retry_count')->default(0)->comment('重试次数');
            $table->integer('max_retries')->default(3)->comment('最大重试次数');
            $table->dateTime('failed_at')->nullable()->comment('失败时间');
            $table->dateTime('next_retry_at')->nullable()->comment('下次重试时间');
            $table->unsignedBigInteger('created_by')->nullable()->comment('创建人');
            $table->timestamps();
            $table->softDeletes();

            $table->index('batch_id');
            $table->index('job_type');
            $table->index('status');
            $table->index('next_retry_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('failed_batches');
    }
};
