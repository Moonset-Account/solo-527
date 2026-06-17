<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reconciliation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->comment('关联项目');
            $table->foreignId('reconciliation_statement_id')->constrained()->comment('关联对账单');
            $table->decimal('receivable_amount', 15, 2)->comment('应收金额');
            $table->decimal('received_amount', 15, 2)->default(0)->comment('实收金额');
            $table->decimal('difference_amount', 15, 2)->default(0)->comment('差异金额');
            $table->text('remarks')->nullable()->comment('备注');
            $table->softDeletes();
            $table->timestamps();

            $table->index('project_id');
            $table->index('reconciliation_statement_id');
            $table->index('receivable_amount');
            $table->index('received_amount');
            $table->index('difference_amount');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reconciliation_items');
    }
};
