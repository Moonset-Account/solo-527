<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_callbacks', function (Blueprint $table) {
            $table->id();
            $table->string('payment_no')->unique()->comment('支付单号');
            $table->string('status')->default('pending')->comment('状态');
            $table->text('failure_reason')->nullable()->comment('失败原因');
            $table->integer('retry_count')->default(0)->comment('重试次数');
            $table->text('affected_documents')->nullable()->comment('影响单据');
            $table->decimal('amount', 15, 2)->nullable()->comment('支付金额');
            $table->string('payment_method')->nullable()->comment('支付方式');
            $table->dateTime('callback_time')->nullable()->comment('回调时间');
            $table->text('callback_data')->nullable()->comment('回调数据');
            $table->text('remarks')->nullable()->comment('备注');
            $table->softDeletes();
            $table->timestamps();

            $table->index('payment_no');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_callbacks');
    }
};
