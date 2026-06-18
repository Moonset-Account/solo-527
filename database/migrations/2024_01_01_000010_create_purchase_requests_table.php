<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_requests', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique()->comment('申请单号');
            $table->string('title')->comment('申请标题');
            $table->string('department')->nullable()->comment('申请部门');
            $table->unsignedBigInteger('requester_id')->comment('申请人ID');
            $table->string('requester_name')->comment('申请人姓名');
            $table->date('request_date')->comment('申请日期');
            $table->date('expected_date')->nullable()->comment('期望到货日期');
            $table->string('priority')->default('normal')->comment('优先级: urgent, high, normal, low');
            $table->text('reason')->nullable()->comment('采购事由');
            $table->text('remark')->nullable()->comment('备注');
            $table->unsignedBigInteger('flow_id')->nullable()->comment('审批流ID');
            $table->string('status')->default('draft')->comment('状态: draft, pending, approved, rejected, cancelled, completed');
            $table->integer('current_step')->default(0)->comment('当前审批步骤');
            $table->integer('total_steps')->default(0)->comment('总审批步骤');
            $table->decimal('total_amount', 14, 2)->default(0)->comment('总金额');
            $table->unsignedBigInteger('financial_review_id')->nullable()->comment('财务复核ID');
            $table->boolean('is_financial_reviewed')->default(false)->comment('是否已财务复核');
            $table->unsignedBigInteger('approved_by')->nullable()->comment('最终审批人ID');
            $table->timestamp('approved_at')->nullable()->comment('最终审批时间');
            $table->unsignedBigInteger('rejected_by')->nullable()->comment('驳回人ID');
            $table->timestamp('rejected_at')->nullable()->comment('驳回时间');
            $table->text('reject_reason')->nullable()->comment('驳回原因');
            $table->unsignedBigInteger('created_by')->nullable()->comment('创建人');
            $table->unsignedBigInteger('updated_by')->nullable()->comment('更新人');
            $table->timestamps();
            $table->softDeletes();

            $table->index('requester_id');
            $table->index('status');
            $table->index('priority');
            $table->index('request_date');
            $table->index('flow_id');
            $table->index('department');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_requests');
    }
};
