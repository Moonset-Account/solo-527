<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_request_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('request_id')->comment('采购申请ID');
            $table->unsignedBigInteger('supply_id')->nullable()->comment('耗材ID');
            $table->string('supply_code')->nullable()->comment('耗材编码');
            $table->string('supply_name')->comment('耗材名称');
            $table->string('specification')->nullable()->comment('规格型号');
            $table->string('brand')->nullable()->comment('品牌');
            $table->string('unit')->comment('计量单位');
            $table->decimal('quantity', 12, 2)->comment('数量');
            $table->decimal('reference_price', 12, 2)->nullable()->comment('参考单价');
            $table->decimal('estimated_price', 12, 2)->nullable()->comment('预估单价');
            $table->decimal('estimated_amount', 14, 2)->nullable()->comment('预估金额');
            $table->decimal('current_stock', 12, 2)->nullable()->comment('当前库存');
            $table->text('remark')->nullable()->comment('备注');
            $table->integer('sort')->default(0)->comment('排序');
            $table->unsignedBigInteger('created_by')->nullable()->comment('创建人');
            $table->unsignedBigInteger('updated_by')->nullable()->comment('更新人');
            $table->timestamps();
            $table->softDeletes();

            $table->index('request_id');
            $table->index('supply_id');
            $table->foreign('request_id')->references('id')->on('purchase_requests')->onDelete('cascade');
            $table->foreign('supply_id')->references('id')->on('supplies')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_request_items');
    }
};
