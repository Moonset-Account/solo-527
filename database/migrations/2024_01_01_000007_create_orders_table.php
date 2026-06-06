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
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->foreignId('salesperson_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->decimal('debt_amount', 12, 2)->default(0);
            $table->string('status')->default('pending')->comment('pending:待确认,confirmed:已确认,picking:拣货中,shipped:已发货,completed:已完成,cancelled:已取消');
            $table->string('payment_status')->default('unpaid')->comment('unpaid:未付款,partial:部分付款,paid:已付款');
            $table->string('payment_method')->nullable()->comment('cash:现金,bank:银行转账,wechat:微信,alipay:支付宝,credit:赊账');
            $table->tinyInteger('urgent_level')->default(0)->comment('0:普通,1:紧急,2:特急');
            $table->timestamp('expected_delivery_at')->nullable();
            $table->text('shipping_address')->nullable();
            $table->text('remarks')->nullable();
            $table->string('source')->default('phone')->comment('phone:电话,online:线上,walkin:门店');
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['customer_id', 'status']);
            $table->index(['status', 'created_at']);
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->integer('quantity');
            $table->integer('picked_quantity')->default(0);
            $table->integer('shipped_quantity')->default(0);
            $table->integer('returned_quantity')->default(0);
            $table->decimal('unit_price', 12, 2);
            $table->decimal('total_price', 12, 2);
            $table->decimal('cost_price', 12, 2)->nullable();
            $table->string('status')->default('pending')->comment('pending:待处理,picking:拣货中,picked:已拣货,shipped:已发货,completed:完成,returned:退货,cancelled:取消');
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->index(['order_id', 'product_id']);
            $table->index(['product_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
