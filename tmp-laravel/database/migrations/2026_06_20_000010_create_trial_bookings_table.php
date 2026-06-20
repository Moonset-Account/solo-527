<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trial_bookings', function (Blueprint $table) {
            $table->id();
            $table->string('student_name');
            $table->string('phone');
            $table->foreignId('art_class_id')->constrained('art_classes');
            $table->date('preferred_date');
            $table->string('preferred_time');
            $table->enum('status', ['pending', 'confirmed', 'completed', 'cancelled'])->default('pending');
            $table->string('source')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('converted')->default(false);
            $table->timestamp('converted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trial_bookings');
    }
};
