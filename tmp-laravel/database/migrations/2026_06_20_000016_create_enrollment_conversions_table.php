<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enrollment_conversions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trial_booking_id')->nullable()->constrained('trial_bookings');
            $table->foreignId('student_id')->nullable()->constrained('students');
            $table->foreignId('art_class_id')->constrained('art_classes');
            $table->timestamp('converted_at');
            $table->enum('conversion_type', ['direct', 'follow_up'])->default('direct');
            $table->text('follow_up_notes')->nullable();
            $table->foreignId('operator_id')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollment_conversions');
    }
};
