<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_daily_splits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->onDelete('cascade');
            $table->date('split_date');
            $table->timestamp('segment_start');
            $table->timestamp('segment_end');
            $table->integer('duration_minutes');
            $table->decimal('segment_amount', 10, 2);
            $table->decimal('owner_share', 10, 2)->default(0);
            $table->decimal('platform_share', 10, 2)->default(0);
            $table->timestamps();
            $table->index(['booking_id', 'split_date']);
            $table->index(['split_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_daily_splits');
    }
};
