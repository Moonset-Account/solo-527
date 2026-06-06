<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pickup_slots', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('max_orders')->default(10);
            $table->integer('current_orders')->default(0);
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['date', 'start_time', 'end_time']);
            $table->index(['date', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pickup_slots');
    }
};
