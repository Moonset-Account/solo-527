<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sorting_tasks', function (Blueprint $table) {
            $table->id();
            $table->string('task_no')->unique();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('greenhouse_id');
            $table->unsignedBigInteger('assigned_to')->nullable();
            $table->float('planned_quantity');
            $table->float('actual_quantity')->nullable();
            $table->date('planned_sort_date')->nullable();
            $table->timestamp('actual_start_time')->nullable();
            $table->timestamp('actual_end_time')->nullable();
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->string('quality_level')->nullable();
            $table->text('remark')->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->index('greenhouse_id');
            $table->index('assigned_to');
            $table->index('status');
            $table->index('planned_sort_date');

            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->onDelete('cascade');

            $table->foreign('greenhouse_id')
                ->references('id')
                ->on('greenhouses')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sorting_tasks');
    }
};
