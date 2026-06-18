<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_records', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type')->comment('关联类型: purchase_request, quotation');
            $table->unsignedBigInteger('entity_id')->comment('关联ID');
            $table->unsignedBigInteger('flow_id')->nullable()->comment('审批流ID');
            $table->unsignedBigInteger('flow_step_id')->nullable()->comment('审批步骤ID');
            $table->integer('step_order')->comment('步骤顺序');
            $table->string('step_name')->nullable()->comment('步骤名称');
            $table->string('approver_type')->nullable()->comment('审批人类型');
            $table->unsignedBigInteger('approver_id')->nullable()->comment('审批人ID');
            $table->string('approver_name')->nullable()->comment('审批人姓名');
            $table->string('status')->default('pending')->comment('状态: pending, approved, rejected, transferred, auto_approved');
            $table->text('comment')->nullable()->comment('审批意见');
            $table->timestamp('action_at')->nullable()->comment('操作时间');
            $table->ipAddress('ip_address')->nullable()->comment('操作IP');
            $table->string('user_agent')->nullable()->comment('用户代理');
            $table->unsignedBigInteger('transferred_to_id')->nullable()->comment('转交给');
            $table->string('transferred_reason')->nullable()->comment('转交原因');
            $table->text('extra_data')->nullable()->comment('额外数据(JSON)');
            $table->unsignedBigInteger('created_by')->nullable()->comment('创建人');
            $table->unsignedBigInteger('updated_by')->nullable()->comment('更新人');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['entity_type', 'entity_id']);
            $table->index('approver_id');
            $table->index('status');
            $table->index('flow_id');
            $table->index('step_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_records');
    }
};
