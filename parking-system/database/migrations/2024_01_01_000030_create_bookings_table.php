<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_no', 32)->unique();
            $table->foreignId('spot_id')->constrained('parking_spots');
            $table->foreignId('visitor_id')->constrained('users');
            $table->foreignId('availability_id')->nullable()->constrained('spot_availability');
            $table->string('license_plate', 20);
            $table->timestamp('start_time');
            $table->timestamp('end_time');
            $table->decimal('total_amount', 10, 2);
            $table->decimal('owner_earning', 10, 2)->default(0);
            $table->decimal('platform_fee', 10, 2)->default(0);
            $table->decimal('refund_amount', 10, 2)->default(0);
            $table->text('cancel_reason')->nullable();
            $table->enum('status', [
                'pending', 'confirmed', 'paid', 'locked', 'in_progress',
                'completed', 'cancelled', 'refunded', 'disputed'
            ])->default('pending');
            $table->boolean('is_locked')->default(false);
            $table->timestamp('locked_at')->nullable();
            $table->integer('lock_expires_at')->nullable();
            $table->string('lock_key', 64)->nullable();
            $table->boolean('cross_midnight')->default(false);
            $table->integer('manual_intervention_count')->default(0);
            $table->text('remark')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['spot_id', 'start_time', 'end_time']);
            $table->index(['visitor_id', 'status']);
            $table->index(['status', 'start_time']);
            $table->index(['is_locked', 'lock_expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
