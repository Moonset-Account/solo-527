<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_flows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->comment('关联项目');
            $table->string('type')->comment('类型:收款/付款');
            $table->decimal('amount', 15, 2)->comment('金额');
            $table->date('transaction_date')->comment('交易日期');
            $table->string('payment_method')->nullable()->comment('支付方式');
            $table->string('transaction_no')->nullable()->comment('交易单号');
            $table->text('remarks')->nullable()->comment('备注');
            $table->softDeletes();
            $table->timestamps();

            $table->index('project_id');
            $table->index('type');
            $table->index('transaction_date');
            $table->index('transaction_no');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_flows');
    }
};
