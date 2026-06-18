<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('delivery_confirmation_id')->comment('到货确认ID');
            $table->unsignedBigInteger('supply_id')->comment('耗材ID');
            $table->string('supply_name')->comment('耗材名称');
            $table->string('specification')->nullable()->comment('规格型号');
            $table->string('unit')->nullable()->comment('单位');
            $table->decimal('expected_quantity', 12, 2)->default(0)->comment('应到数量');
            $table->decimal('received_quantity', 12, 2)->default(0)->comment('实收数量');
            $table->decimal('unit_price', 14, 2)->nullable()->comment('单价');
            $table->decimal('total_price', 14, 2)->nullable()->comment('总价');
            $table->string('batch_no')->nullable()->comment('批号');
            $table->date('production_date')->nullable()->comment('生产日期');
            $table->date('expiry_date')->nullable()->comment('有效期');
            $table->text('remark')->nullable()->comment('备注');
            $table->timestamps();

            $table->index('delivery_confirmation_id');
            $table->index('supply_id');
            $table->foreign('delivery_confirmation_id')->references('id')->on('delivery_confirmations')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_items');
    }
};
