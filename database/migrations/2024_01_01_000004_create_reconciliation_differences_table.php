<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reconciliation_differences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reconciliation_item_id')->constrained()->comment('关联对账明细');
            $table->string('difference_type')->comment('差异类型');
            $table->decimal('amount', 15, 2)->comment('差异金额');
            $table->string('status')->default('pending')->comment('状态');
            $table->string('responsible_person')->comment('责任人');
            $table->date('processing_deadline')->comment('处理时限');
            $table->text('description')->nullable()->comment('差异描述');
            $table->text('resolution')->nullable()->comment('解决方案');
            $table->date('resolved_at')->nullable()->comment('解决时间');
            $table->softDeletes();
            $table->timestamps();

            $table->index('reconciliation_item_id');
            $table->index('difference_type');
            $table->index('status');
            $table->index('responsible_person');
            $table->index('processing_deadline');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reconciliation_differences');
    }
};
