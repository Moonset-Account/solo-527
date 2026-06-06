<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spot_availability', function (Blueprint $table) {
            $table->id();
            $table->foreignId('spot_id')->constrained('parking_spots')->onDelete('cascade');
            $table->timestamp('start_time');
            $table->timestamp('end_time');
            $table->decimal('custom_rate', 10, 2)->nullable();
            $table->enum('status', ['available', 'booked', 'expired'])->default('available');
            $table->boolean('is_recurring')->default(false);
            $table->string('recurring_pattern', 50)->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['spot_id', 'start_time', 'end_time']);
            $table->index(['status', 'start_time']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spot_availability');
    }
};
