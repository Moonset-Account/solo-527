<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cashier_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_no');
            $table->foreignId('work_order_id')->nullable()->constrained('work_orders')->nullOnDelete();
            $table->foreignId('vehicle_id')->constrained('vehicles')->cascadeOnDelete();
            $table->foreignId('service_item_id')->constrained('service_items')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('payment_method');
            $table->enum('payment_status', ['unpaid', 'partial', 'paid'])->default('unpaid');
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('operator_id')->constrained('users')->cascadeOnDelete();
            $table->string('operator_name');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique('order_no');
            $table->index('work_order_id');
            $table->index('vehicle_id');
            $table->index('service_item_id');
            $table->index('payment_status');
            $table->index('operator_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cashier_orders');
    }
};
