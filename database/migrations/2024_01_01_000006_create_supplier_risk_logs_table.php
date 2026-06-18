<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_risk_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('supplier_id')->comment('供应商ID');
            $table->string('risk_type')->comment('风险类型: qualification, delivery, quality, financial, other');
            $table->string('risk_level')->comment('风险等级: low, medium, high, critical');
            $table->string('title')->comment('风险标题');
            $table->text('description')->nullable()->comment('风险描述');
            $table->date('occurred_at')->nullable()->comment('发生日期');
            $table->string('status')->default('pending')->comment('状态: pending, processing, resolved, closed');
            $table->text('handling_measures')->nullable()->comment('处理措施');
            $table->text('resolution_result')->nullable()->comment('处理结果');
            $table->date('resolved_at')->nullable()->comment('解决日期');
            $table->unsignedBigInteger('handled_by')->nullable()->comment('处理人ID');
            $table->unsignedBigInteger('created_by')->nullable()->comment('创建人');
            $table->unsignedBigInteger('updated_by')->nullable()->comment('更新人');
            $table->timestamps();
            $table->softDeletes();

            $table->index('supplier_id');
            $table->index('risk_type');
            $table->index('risk_level');
            $table->index('status');
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_risk_logs');
    }
};
