<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_flow_steps', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('flow_id')->comment('审批流ID');
            $table->string('name')->comment('步骤名称');
            $table->integer('step_order')->comment('步骤顺序');
            $table->string('approver_type')->comment('审批人类型: user, role, department, position, manager');
            $table->unsignedBigInteger('approver_id')->nullable()->comment('审批人ID或角色ID');
            $table->string('approver_value')->nullable()->comment('审批人值(JSON)');
            $table->string('approval_mode')->default('single')->comment('审批方式: single, all, any');
            $table->boolean('is_required')->default(true)->comment('是否必须审批');
            $table->integer('timeout_hours')->nullable()->comment('超时时间(小时)');
            $table->string('timeout_action')->nullable()->comment('超时动作: auto_approve, auto_reject, notify');
            $table->text('remark')->nullable()->comment('备注');
            $table->unsignedBigInteger('created_by')->nullable()->comment('创建人');
            $table->unsignedBigInteger('updated_by')->nullable()->comment('更新人');
            $table->timestamps();
            $table->softDeletes();

            $table->index('flow_id');
            $table->index('step_order');
            $table->foreign('flow_id')->references('id')->on('approval_flows')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_flow_steps');
    }
};
