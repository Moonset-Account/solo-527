<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('retry_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('batch_id')->nullable()->comment('失败批次ID');
            $table->string('batch_code')->nullable()->comment('批次编码');
            $table->string('job_type')->comment('任务类型');
            $table->integer('attempt')->comment('第几次重试');
            $table->text('payload')->nullable()->comment('任务数据(JSON)');
            $table->text('exception')->nullable()->comment('异常信息');
            $table->text('trace')->nullable()->comment('异常堆栈');
            $table->string('status')->default('pending')->comment('状态: pending, processing, success, failed');
            $table->dateTime('executed_at')->nullable()->comment('执行时间');
            $table->decimal('execution_time', 10, 4)->nullable()->comment('执行耗时(秒)');
            $table->ipAddress('ip_address')->nullable()->comment('执行IP');
            $table->unsignedBigInteger('handled_by')->nullable()->comment('处理人');
            $table->timestamps();
            $table->softDeletes();

            $table->index('batch_id');
            $table->index('job_type');
            $table->index('status');
            $table->foreign('batch_id')->references('id')->on('failed_batches')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('retry_logs');
    }
};
