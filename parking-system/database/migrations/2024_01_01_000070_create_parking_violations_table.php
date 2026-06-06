<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parking_violations', function (Blueprint $table) {
            $table->id();
            $table->string('violation_no', 32)->unique();
            $table->foreignId('booking_id')->nullable()->constrained('bookings');
            $table->foreignId('spot_id')->constrained('parking_spots');
            $table->string('license_plate', 20);
            $table->enum('type', ['no_booking', 'overtime', 'wrong_spot', 'unauthorized']);
            $table->timestamp('violation_time');
            $table->decimal('fine_amount', 10, 2);
            $table->text('description')->nullable();
            $table->json('evidence_images')->nullable();
            $table->enum('status', ['pending', 'confirmed', 'appealed', 'cancelled', 'paid'])->default('pending');
            $table->boolean('has_appeal')->default(false);
            $table->timestamp('appeal_lock_until')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users');
            $table->timestamp('processed_at')->nullable();
            $table->text('process_remark')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['license_plate', 'violation_time']);
            $table->index(['spot_id', 'status']);
            $table->index(['has_appeal', 'appeal_lock_until']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parking_violations');
    }
};
