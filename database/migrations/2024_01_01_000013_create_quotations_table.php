<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique()->comment('报价单号');
            $table->unsignedBigInteger('request_id')->nullable()->comment('采购申请ID');
            $table->unsignedBigInteger('supplier_id')->comment('供应商ID');
            $table->string('supplier_name')->comment('供应商名称');
            $table->string('supplier_contact')->nullable()->comment('供应商联系人');
            $table->string('supplier_phone')->nullable()->comment('供应商电话');
            $table->unsignedBigInteger('contact_id')->nullable()->comment('我方联系人ID');
            $table->string('contact_name')->nullable()->comment('我方联系人');
            $table->date('quotation_date')->comment('报价日期');
            $table->date('valid_until')->nullable()->comment('报价有效期至');
            $table->string('payment_terms')->nullable()->comment('付款条件');
            $table->string('delivery_terms')->nullable()->comment('交货条件');
            $table->integer('delivery_days')->nullable()->comment('交货周期(天)');
            $table->string('delivery_address')->nullable()->comment('送货地址');
            $table->decimal('tax_rate', 5, 2)->nullable()->comment('税率(%)');
            $table->decimal('subtotal_amount', 14, 2)->default(0)->comment('不含税金额');
            $table->decimal('tax_amount', 14, 2)->default(0)->comment('税额');
            $table->decimal('total_amount', 14, 2)->default(0)->comment('含税总金额');
            $table->text('remark')->nullable()->comment('备注');
            $table->string('status')->default('draft')->comment('状态: draft, submitted, approved, rejected, expired, cancelled');
            $table->boolean('is_selected')->default(false)->comment('是否中标');
            $table->unsignedBigInteger('flow_id')->nullable()->comment('审批流ID');
            $table->boolean('is_expiry_reminded')->default(false)->comment('是否已发送过期提醒');
            $table->unsignedBigInteger('approved_by')->nullable()->comment('审批人ID');
            $table->timestamp('approved_at')->nullable()->comment('审批时间');
            $table->unsignedBigInteger('created_by')->nullable()->comment('创建人');
            $table->unsignedBigInteger('updated_by')->nullable()->comment('更新人');
            $table->timestamps();
            $table->softDeletes();

            $table->index('request_id');
            $table->index('supplier_id');
            $table->index('status');
            $table->index('valid_until');
            $table->index('quotation_date');
            $table->foreign('request_id')->references('id')->on('purchase_requests')->onDelete('set null');
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotations');
    }
};
