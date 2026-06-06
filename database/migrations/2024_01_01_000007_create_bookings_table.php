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
            $table->foreignId('member_id')->constrained()->onDelete('cascade');
            $table->foreignId('coach_id')->constrained()->onDelete('cascade');
            $table->foreignId('course_type_id')->constrained()->onDelete('cascade');
            $table->foreignId('package_id')->nullable()->constrained('member_course_packages')->onDelete('set null');
            $table->dateTime('start_time');
            $table->dateTime('end_time');
            $table->string('status')->default('pending');
            $table->boolean('is_free_cancellation')->default(true);
            $table->integer('cancellation_deadline_hours')->default(24);
            $table->text('notes')->nullable();
            $table->text('cancel_reason')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users');
            $table->dateTime('cancelled_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('confirmed_by')->nullable()->constrained('users');
            $table->dateTime('confirmed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['coach_id', 'start_time']);
            $table->index(['member_id', 'start_time']);
            $table->index(['status', 'start_time']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
