<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->string('shipment_no')->unique();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('sorting_task_id')->nullable();
            $table->unsignedBigInteger('greenhouse_id');
            $table->string('logistics_company')->nullable();
            $table->string('tracking_no')->nullable();
            $table->date('shipment_date')->nullable();
            $table->date('estimated_arrival')->nullable();
            $table->date('actual_arrival')->nullable();
            $table->string('receiver_name');
            $table->string('receiver_phone');
            $table->text('receiver_address');
            $table->enum('status', ['pending', 'shipped', 'in_transit', 'delivered', 'returned'])->default('pending');
            $table->float('weight')->nullable();
            $table->integer('packages')->nullable();
            $table->text('remark')->nullable();
            $table->unsignedBigInteger('shipped_by')->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->index('sorting_task_id');
            $table->index('greenhouse_id');
            $table->index('status');
            $table->index('tracking_no');
            $table->index('shipment_date');
            $table->index('shipped_by');

            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->onDelete('cascade');

            $table->foreign('sorting_task_id')
                ->references('id')
                ->on('sorting_tasks')
                ->onDelete('set null');

            $table->foreign('greenhouse_id')
                ->references('id')
                ->on('greenhouses')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};
