<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settlement_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('settlement_id')->constrained('settlements')->onDelete('cascade');
            $table->foreignId('booking_id')->nullable()->constrained('bookings');
            $table->foreignId('violation_id')->nullable()->constrained('parking_violations');
            $table->enum('type', ['booking_income', 'platform_fee', 'fine', 'refund', 'adjustment']);
            $table->decimal('amount', 10, 2);
            $table->decimal('owner_share', 10, 2)->default(0);
            $table->decimal('platform_share', 10, 2)->default(0);
            $table->text('description')->nullable();
            $table->timestamps();
            $table->index(['settlement_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settlement_items');
    }
};
