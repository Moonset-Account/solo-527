<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sorting_discrepancies', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sorting_task_id');
            $table->unsignedBigInteger('order_id');
            $table->string('discrepancy_type');
            $table->float('planned_qty');
            $table->float('actual_qty');
            $table->float('difference');
            $table->string('unit');
            $table->text('remark')->nullable();
            $table->string('handling_result')->nullable();
            $table->json('social_impact')->nullable();
            $table->unsignedBigInteger('handled_by')->nullable();
            $table->timestamp('handled_at')->nullable();
            $table->enum('status', ['pending', 'handled', 'closed'])->default('pending');
            $table->timestamps();

            $table->index('sorting_task_id');
            $table->index('order_id');
            $table->index('status');
            $table->index('handled_by');

            $table->foreign('sorting_task_id')
                ->references('id')
                ->on('sorting_tasks')
                ->onDelete('cascade');

            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sorting_discrepancies');
    }
};
