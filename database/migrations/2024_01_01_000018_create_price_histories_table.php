<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('supply_id')->comment('耗材ID');
            $table->unsignedBigInteger('supplier_id')->nullable()->comment('供应商ID');
            $table->unsignedBigInteger('quotation_id')->nullable()->comment('报价单ID');
            $table->string('price_type')->default('quotation')->comment('价格类型: quotation, purchase, reference, market');
            $table->decimal('unit_price', 12, 4)->comment('单价');
            $table->decimal('tax_rate', 5, 2)->nullable()->comment('税率(%)');
            $table->decimal('tax_unit_price', 12, 4)->nullable()->comment('含税单价');
            $table->string('unit')->nullable()->comment('计量单位');
            $table->decimal('quantity', 12, 2)->nullable()->comment('数量');
            $table->date('effective_date')->nullable()->comment('生效日期');
            $table->date('expiry_date')->nullable()->comment('失效日期');
            $table->string('currency')->default('CNY')->comment('币种');
            $table->text('remark')->nullable()->comment('备注');
            $table->unsignedBigInteger('created_by')->nullable()->comment('创建人');
            $table->unsignedBigInteger('updated_by')->nullable()->comment('更新人');
            $table->timestamps();
            $table->softDeletes();

            $table->index('supply_id');
            $table->index('supplier_id');
            $table->index('price_type');
            $table->index('effective_date');
            $table->foreign('supply_id')->references('id')->on('supplies')->onDelete('cascade');
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_histories');
    }
};
