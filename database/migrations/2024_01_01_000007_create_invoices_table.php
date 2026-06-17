<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->comment('关联项目');
            $table->string('invoice_no')->unique()->comment('发票号');
            $table->decimal('amount', 15, 2)->comment('金额');
            $table->date('issue_date')->comment('开票日期');
            $table->string('status')->default('pending')->comment('状态');
            $table->text('error_message')->nullable()->comment('错误信息');
            $table->string('tax_rate')->nullable()->comment('税率');
            $table->decimal('tax_amount', 15, 2)->nullable()->comment('税额');
            $table->text('remarks')->nullable()->comment('备注');
            $table->softDeletes();
            $table->timestamps();

            $table->index('project_id');
            $table->index('invoice_no');
            $table->index('issue_date');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
