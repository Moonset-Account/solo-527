<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_discrepancies', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('delivery_id')->comment('到货确认ID');
            $table->unsignedBigInteger('quotation_item_id')->nullable()->comment('报价明细ID');
            $table->unsignedBigInteger('supply_id')->nullable()->comment('耗材ID');
            $table->string('supply_name')->comment('耗材名称');
            $table->string('specification')->nullable()->comment('规格型号');
            $table->string('unit')->nullable()->comment('单位');
            $table->string('discrepancy_type')->comment('差异类型: quantity, quality, specification, damage, other');
            $table->decimal('expected_quantity', 12, 2)->comment('应到数量');
            $table->decimal('actual_quantity', 12, 2)->comment('实到数量');
            $table->decimal('difference', 12, 2)->comment('差异数量');
            $table->text('description')->nullable()->comment('差异描述');
            $table->string('severity')->default('minor')->comment('严重程度: minor, major, critical');
            $table->string('status')->default('reported')->comment('状态: reported, investigating, resolved, closed');
            $table->text('handling_measures')->nullable()->comment('处理措施');
            $table->text('resolution_result')->nullable()->comment('处理结果');
            $table->dateTime('resolved_at')->nullable()->comment('解决时间');
            $table->unsignedBigInteger('handled_by')->nullable()->comment('处理人ID');
            $table->unsignedBigInteger('created_by')->nullable()->comment('创建人');
            $table->unsignedBigInteger('updated_by')->nullable()->comment('更新人');
            $table->timestamps();
            $table->softDeletes();

            $table->index('delivery_id');
            $table->index('discrepancy_type');
            $table->index('status');
            $table->index('severity');
            $table->foreign('delivery_id')->references('id')->on('delivery_confirmations')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_discrepancies');
    }
};
