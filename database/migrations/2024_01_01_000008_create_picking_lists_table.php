<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('picking_lists', function (Blueprint $table) {
            $table->id();
            $table->string('picking_no')->unique();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('picker_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('pending')->comment('pending:待拣货,picking:拣货中,completed:已完成,cancelled:已取消');
            $table->integer('total_items')->default(0);
            $table->integer('picked_items')->default(0);
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['picker_id', 'status']);
            $table->index(['status', 'created_at']);
        });

        Schema::create('picking_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('picking_list_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('quantity');
            $table->integer('picked_quantity')->default(0);
            $table->string('status')->default('pending')->comment('pending:待拣,picking:拣货中,picked:已拣,skipped:跳过');
            $table->timestamp('picked_at')->nullable();
            $table->foreignId('picked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->index(['picking_list_id', 'product_id']);
            $table->index(['location_id', 'status']);
        });

        Schema::create('picking_scans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('picking_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('picker_id')->constrained('users')->cascadeOnDelete();
            $table->string('barcode');
            $table->integer('quantity');
            $table->string('scan_type')->default('pick')->comment('pick:拣货,verify:复核');
            $table->text('device_info')->nullable();
            $table->timestamps();
            $table->index(['picking_item_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('picking_scans');
        Schema::dropIfExists('picking_items');
        Schema::dropIfExists('picking_lists');
    }
};
