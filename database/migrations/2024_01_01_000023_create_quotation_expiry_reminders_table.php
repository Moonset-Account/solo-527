<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotation_expiry_reminders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('quotation_id')->comment('报价单ID');
            $table->string('quotation_code')->comment('报价单号');
            $table->unsignedBigInteger('supplier_id')->nullable()->comment('供应商ID');
            $table->string('supplier_name')->nullable()->comment('供应商名称');
            $table->date('expiry_date')->comment('过期日期');
            $table->integer('days_before_expiry')->comment('提前多少天提醒');
            $table->dateTime('reminder_sent_at')->nullable()->comment('提醒发送时间');
            $table->string('reminder_status')->default('pending')->comment('提醒状态: pending, sent, failed, cancelled');
            $table->integer('send_attempts')->default(0)->comment('发送尝试次数');
            $table->string('reminder_type')->default('email')->comment('提醒方式: email, sms, wechat, system');
            $table->text('recipient_emails')->nullable()->comment('收件人邮箱(JSON)');
            $table->text('recipient_phones')->nullable()->comment('收件人手机(JSON)');
            $table->text('message_content')->nullable()->comment('消息内容');
            $table->text('error_message')->nullable()->comment('错误信息');
            $table->boolean('is_renewed')->default(false)->comment('是否已续签');
            $table->unsignedBigInteger('renewed_quotation_id')->nullable()->comment('续签报价单ID');
            $table->unsignedBigInteger('created_by')->nullable()->comment('创建人');
            $table->unsignedBigInteger('updated_by')->nullable()->comment('更新人');
            $table->timestamps();
            $table->softDeletes();

            $table->index('quotation_id');
            $table->index('supplier_id');
            $table->index('expiry_date');
            $table->index('reminder_status');
            $table->foreign('quotation_id')->references('id')->on('quotations')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotation_expiry_reminders');
    }
};
