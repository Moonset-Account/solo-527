<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('location_id')->constrained()->restrictOnDelete();
            $table->integer('quantity')->default(0);
            $table->integer('locked_quantity')->default(0)->comment('锁定库存');
            $table->integer('available_quantity')->default(0)->comment('可用库存');
            $table->decimal('unit_cost', 12, 2)->nullable();
            $table->date('production_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('batch_no')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['product_id', 'location_id', 'batch_no'], 'inventory_product_location_batch_unique');
            $table->index(['product_id', 'location_id']);
        });

        Schema::create('inventory_locks', function (Blueprint $table) {
            $table->id();
            $table->string('lock_no')->unique();
            $table->foreignId('inventory_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('order_item_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('quantity');
            $table->string('status')->default('locked')->comment('locked:锁定,released:释放,consumed:消耗');
            $table->timestamp('expires_at')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->index(['inventory_id', 'status']);
            $table->index(['order_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_locks');
        Schema::dropIfExists('inventories');
    }
};
