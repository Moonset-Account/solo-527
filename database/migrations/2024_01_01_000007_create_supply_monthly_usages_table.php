<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supply_monthly_usages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('supply_id')->comment('耗材ID');
            $table->unsignedBigInteger('department_id')->nullable()->comment('部门ID');
            $table->string('department')->nullable()->comment('部门名称');
            $table->integer('year')->comment('年份');
            $table->integer('month')->comment('月份');
            $table->decimal('quantity', 12, 2)->default(0)->comment('用量');
            $table->decimal('amount', 14, 2)->default(0)->comment('金额');
            $table->decimal('avg_price', 12, 2)->nullable()->comment('平均单价');
            $table->integer('usage_count')->default(0)->comment('使用次数');
            $table->text('remark')->nullable()->comment('备注');
            $table->unsignedBigInteger('created_by')->nullable()->comment('创建人');
            $table->unsignedBigInteger('updated_by')->nullable()->comment('更新人');
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['supply_id', 'year', 'month', 'department']);
            $table->index('supply_id');
            $table->index(['year', 'month']);
            $table->foreign('supply_id')->references('id')->on('supplies')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supply_monthly_usages');
    }
};
