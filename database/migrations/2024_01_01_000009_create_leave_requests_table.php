<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->onDelete('cascade');
            $table->foreignId('member_id')->constrained()->onDelete('cascade');
            $table->text('reason');
            $table->string('status')->default('pending');
            $table->text('review_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->dateTime('reviewed_at')->nullable();
            $table->boolean('lesson_deducted')->default(false);
            $table->foreignId('submitted_by')->nullable()->constrained('users');
            $table->dateTime('withdrawn_at')->nullable();
            $table->foreignId('withdrawn_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['member_id', 'status']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};
