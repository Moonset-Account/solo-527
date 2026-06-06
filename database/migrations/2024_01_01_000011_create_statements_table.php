<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('statements', function (Blueprint $table) {
            $table->id();
            $table->string('statement_no')->unique();
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('previous_balance', 12, 2)->default(0);
            $table->decimal('sales_amount', 12, 2)->default(0);
            $table->decimal('return_amount', 12, 2)->default(0);
            $table->decimal('payment_amount', 12, 2)->default(0);
            $table->decimal('ending_balance', 12, 2)->default(0);
            $table->integer('order_count')->default(0);
            $table->integer('return_count')->default(0);
            $table->integer('payment_count')->default(0);
            $table->string('status')->default('draft')->comment('draft:草稿,confirmed:已确认,sent:已发送');
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['customer_id', 'start_date', 'end_date']);
            $table->index(['customer_id', 'status']);
        });

        Schema::create('statement_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('statement_id')->constrained()->cascadeOnDelete();
            $table->string('item_type')->comment('order:订单,return:退货,payment:收款,adjustment:调整');
            $table->foreignId('related_id')->nullable();
            $table->string('related_no')->nullable();
            $table->date('transaction_date');
            $table->decimal('debit', 12, 2)->default(0);
            $table->decimal('credit', 12, 2)->default(0);
            $table->decimal('balance', 12, 2);
            $table->text('description')->nullable();
            $table->timestamps();
            $table->index(['statement_id', 'item_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('statement_items');
        Schema::dropIfExists('statements');
    }
};
