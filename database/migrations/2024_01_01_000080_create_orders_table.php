<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_no')->unique();
            $table->unsignedBigInteger('greenhouse_id');
            $table->string('customer_name');
            $table->string('customer_phone');
            $table->text('customer_address')->nullable();
            $table->string('product_name');
            $table->string('product_spec')->nullable();
            $table->float('quantity');
            $table->string('unit');
            $table->float('unit_price');
            $table->float('total_amount');
            $table->date('expected_delivery_date')->nullable();
            $table->enum('status', ['pending', 'confirmed', 'sorting', 'shipped', 'completed', 'cancelled'])->default('pending');
            $table->string('payment_status')->default('unpaid');
            $table->text('remark')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('greenhouse_id');
            $table->index('created_at');
            $table->index('payment_status');
            $table->index('customer_name');
            $table->index('customer_phone');
            $table->index(['greenhouse_id', 'status']);
            $table->index(['status', 'created_at']);

            $table->foreign('greenhouse_id')
                ->references('id')
                ->on('greenhouses')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
