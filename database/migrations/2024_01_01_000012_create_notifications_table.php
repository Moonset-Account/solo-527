<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type');
            $table->string('channel');
            $table->string('title');
            $table->text('content');
            $table->json('data')->nullable();
            $table->string('status')->default('pending');
            $table->integer('retry_count')->default(0);
            $table->integer('max_retries')->default(3);
            $table->text('error_message')->nullable();
            $table->dateTime('sent_at')->nullable();
            $table->dateTime('last_retry_at')->nullable();
            $table->dateTime('next_retry_at')->nullable();
            $table->foreignId('related_booking_id')->nullable()->constrained('bookings')->onDelete('set null');
            $table->foreignId('related_member_id')->nullable()->constrained('members')->onDelete('set null');
            $table->foreignId('related_coach_id')->nullable()->constrained('coaches')->onDelete('set null');
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['status', 'next_retry_at']);
            $table->index(['type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
