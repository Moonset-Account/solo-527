<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->onDelete('cascade');
            $table->foreignId('member_id')->constrained()->onDelete('cascade');
            $table->foreignId('coach_id')->constrained()->onDelete('cascade');
            $table->string('status')->default('pending');
            $table->boolean('is_coach_signed')->default(false);
            $table->boolean('needs_review')->default(false);
            $table->text('review_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->dateTime('reviewed_at')->nullable();
            $table->dateTime('signed_in_at')->nullable();
            $table->foreignId('signed_in_by')->nullable()->constrained('users');
            $table->text('coach_notes')->nullable();
            $table->text('member_feedback')->nullable();
            $table->integer('rating')->nullable();
            $table->boolean('lesson_deducted')->default(false);
            $table->foreignId('deducted_by')->nullable()->constrained('users');
            $table->dateTime('deducted_at')->nullable();
            $table->timestamps();

            $table->index(['booking_id', 'status']);
            $table->index(['coach_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
