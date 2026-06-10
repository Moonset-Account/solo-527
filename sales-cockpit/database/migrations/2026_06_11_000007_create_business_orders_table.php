<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_no')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('status', ['pending', 'processing', 'completed', 'closed'])->default('pending');
            $table->unsignedBigInteger('handler_id')->nullable();
            $table->timestamp('handled_at')->nullable();
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->foreign('handler_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_orders');
    }
};
