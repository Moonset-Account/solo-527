<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settlements', function (Blueprint $table) {
            $table->id();
            $table->string('settlement_no', 32)->unique();
            $table->foreignId('owner_id')->constrained('users');
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('total_booking_amount', 10, 2)->default(0);
            $table->decimal('total_owner_earning', 10, 2)->default(0);
            $table->decimal('total_platform_fee', 10, 2)->default(0);
            $table->decimal('total_refund', 10, 2)->default(0);
            $table->decimal('total_fine_income', 10, 2)->default(0);
            $table->decimal('net_settlement', 10, 2)->default(0);
            $table->integer('total_bookings')->default(0);
            $table->integer('manual_intervention_count')->default(0);
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->timestamp('settled_at')->nullable();
            $table->text('remark')->nullable();
            $table->timestamps();
            $table->index(['owner_id', 'period_start', 'period_end']);
            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settlements');
    }
};
