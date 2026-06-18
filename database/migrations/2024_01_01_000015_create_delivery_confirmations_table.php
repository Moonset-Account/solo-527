<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_confirmations', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique()->comment('到货确认单号');
            $table->unsignedBigInteger('quotation_id')->nullable()->comment('报价单ID');
            $table->unsignedBigInteger('request_id')->nullable()->comment('采购申请ID');
            $table->unsignedBigInteger('supplier_id')->comment('供应商ID');
            $table->string('supplier_name')->comment('供应商名称');
            $table->string('delivery_no')->nullable()->comment('送货单号');
            $table->string('logistics_company')->nullable()->comment('物流公司');
            $table->string('tracking_no')->nullable()->comment('物流单号');
            $table->dateTime('delivery_time')->comment('到货时间');
            $table->unsignedBigInteger('receiver_id')->nullable()->comment('收货人ID');
            $table->string('receiver_name')->nullable()->comment('收货人姓名');
            $table->string('delivery_address')->nullable()->comment('收货地址');
            $table->string('inspector_name')->nullable()->comment('验货人');
            $table->dateTime('inspection_time')->nullable()->comment('验货时间');
            $table->text('inspection_result')->nullable()->comment('验货结果');
            $table->string('status')->default('pending')->comment('状态: pending, confirmed, partial, rejected');
            $table->decimal('total_quantity', 12, 2)->default(0)->comment('总数量');
            $table->decimal('received_quantity', 12, 2)->default(0)->comment('已收数量');
            $table->decimal('total_amount', 14, 2)->default(0)->comment('总金额');
            $table->text('remark')->nullable()->comment('备注');
            $table->boolean('has_discrepancy')->default(false)->comment('是否有差异');
            $table->unsignedBigInteger('created_by')->nullable()->comment('创建人');
            $table->unsignedBigInteger('updated_by')->nullable()->comment('更新人');
            $table->timestamps();
            $table->softDeletes();

            $table->index('quotation_id');
            $table->index('request_id');
            $table->index('supplier_id');
            $table->index('status');
            $table->index('delivery_time');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_confirmations');
    }
};
