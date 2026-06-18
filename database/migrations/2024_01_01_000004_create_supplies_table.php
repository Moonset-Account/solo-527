<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplies', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique()->comment('耗材编码');
            $table->string('name')->comment('耗材名称');
            $table->string('specification')->nullable()->comment('规格型号');
            $table->string('brand')->nullable()->comment('品牌');
            $table->string('unit')->comment('计量单位');
            $table->unsignedBigInteger('category_id')->comment('分类ID');
            $table->decimal('min_stock', 12, 2)->default(0)->comment('最低库存');
            $table->decimal('max_stock', 12, 2)->default(0)->comment('最高库存');
            $table->decimal('current_stock', 12, 2)->default(0)->comment('当前库存');
            $table->decimal('reference_price', 12, 2)->nullable()->comment('参考单价');
            $table->string('storage_location')->nullable()->comment('存放位置');
            $table->text('remark')->nullable()->comment('备注');
            $table->boolean('is_active')->default(true)->comment('是否启用');
            $table->unsignedBigInteger('created_by')->nullable()->comment('创建人');
            $table->unsignedBigInteger('updated_by')->nullable()->comment('更新人');
            $table->timestamps();
            $table->softDeletes();

            $table->index('category_id');
            $table->index('is_active');
            $table->index('current_stock');
            $table->foreign('category_id')->references('id')->on('supply_categories')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplies');
    }
};
