<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('financial_reviews', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type')->comment('关联类型: purchase_request, quotation');
            $table->unsignedBigInteger('entity_id')->comment('关联ID');
            $table->string('entity_code')->nullable()->comment('关联单号');
            $table->decimal('total_amount', 14, 2)->default(0)->comment('总金额');
            $table->decimal('budget_amount', 14, 2)->nullable()->comment('预算金额');
            $table->decimal('available_budget', 14, 2)->nullable()->comment('可用预算');
            $table->string('budget_type')->nullable()->comment('预算类型: capital, operating, project');
            $table->string('budget_code')->nullable()->comment('预算编号');
            $table->text('review_points')->nullable()->comment('复核要点');
            $table->text('review_comments')->nullable()->comment('复核意见');
            $table->string('status')->default('pending')->comment('状态: pending, approved, rejected, need_more_info');
            $table->unsignedBigInteger('reviewer_id')->nullable()->comment('复核人ID');
            $table->string('reviewer_name')->nullable()->comment('复核人姓名');
            $table->dateTime('reviewed_at')->nullable()->comment('复核时间');
            $table->text('reject_reason')->nullable()->comment('驳回原因');
            $table->boolean('is_within_budget')->nullable()->comment('是否在预算内');
            $table->boolean('requires_additional_approval')->default(false)->comment('是否需要额外审批');
            $table->text('attachments')->nullable()->comment('附件(JSON)');
            $table->unsignedBigInteger('created_by')->nullable()->comment('创建人');
            $table->unsignedBigInteger('updated_by')->nullable()->comment('更新人');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['entity_type', 'entity_id']);
            $table->index('status');
            $table->index('reviewer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('financial_reviews');
    }
};
