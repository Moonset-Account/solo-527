<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotation_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('quotation_id')->comment('报价单ID');
            $table->unsignedBigInteger('request_item_id')->nullable()->comment('采购申请明细ID');
            $table->unsignedBigInteger('supply_id')->nullable()->comment('耗材ID');
            $table->string('supply_code')->nullable()->comment('耗材编码');
            $table->string('supply_name')->comment('耗材名称');
            $table->string('specification')->nullable()->comment('规格型号');
            $table->string('brand')->nullable()->comment('品牌');
            $table->string('unit')->comment('计量单位');
            $table->decimal('quantity', 12, 2)->comment('报价数量');
            $table->decimal('unit_price', 12, 4)->comment('单价');
            $table->decimal('tax_rate', 5, 2)->nullable()->comment('税率(%)');
            $table->decimal('tax_amount', 14, 2)->default(0)->comment('税额');
            $table->decimal('subtotal', 14, 2)->default(0)->comment('不含税金额');
            $table->decimal('amount', 14, 2)->comment('含税金额');
            $table->string('manufacturer')->nullable()->comment('生产厂家');
            $table->string('origin')->nullable()->comment('产地');
            $table->date('production_date')->nullable()->comment('生产日期');
            $table->date('expiry_date')->nullable()->comment('有效期至');
            $table->string('batch_no')->nullable()->comment('批号');
            $table->text('remark')->nullable()->comment('备注');
            $table->integer('sort')->default(0)->comment('排序');
            $table->unsignedBigInteger('created_by')->nullable()->comment('创建人');
            $table->unsignedBigInteger('updated_by')->nullable()->comment('更新人');
            $table->timestamps();
            $table->softDeletes();

            $table->index('quotation_id');
            $table->index('supply_id');
            $table->foreign('quotation_id')->references('id')->on('quotations')->onDelete('cascade');
            $table->foreign('supply_id')->references('id')->on('supplies')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotation_items');
    }
};
