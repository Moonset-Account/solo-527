<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entry_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->nullable()->constrained('bookings');
            $table->foreignId('spot_id')->nullable()->constrained('parking_spots');
            $table->string('license_plate', 20);
            $table->enum('type', ['entry', 'exit']);
            $table->timestamp('occurred_at');
            $table->enum('recognition_method', ['auto', 'manual', 'corrected']);
            $table->foreignId('operator_id')->nullable()->constrained('users');
            $table->string('device_id', 100)->nullable();
            $table->string('image_url', 500)->nullable();
            $table->decimal('recognition_confidence', 5, 2)->nullable();
            $table->boolean('is_manual_release')->default(false);
            $table->text('release_reason')->nullable();
            $table->text('remark')->nullable();
            $table->timestamps();
            $table->index(['license_plate', 'occurred_at']);
            $table->index(['spot_id', 'occurred_at']);
            $table->index(['booking_id', 'type']);
            $table->index(['is_manual_release', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entry_records');
    }
};
