<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('status_timeline', function (Blueprint $table) {
            $table->id();
            $table->foreignId('work_order_id')->constrained('work_orders')->cascadeOnDelete();
            $table->string('from_status');
            $table->string('to_status');
            $table->foreignId('handler_id')->constrained('users')->cascadeOnDelete();
            $table->string('handler_name');
            $table->text('remarks')->nullable();
            $table->timestamp('created_at');

            $table->index('work_order_id');
            $table->index('handler_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('status_timeline');
    }
};
