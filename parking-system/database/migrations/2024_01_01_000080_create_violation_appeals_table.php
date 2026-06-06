<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('violation_appeals', function (Blueprint $table) {
            $table->id();
            $table->string('appeal_no', 32)->unique();
            $table->foreignId('violation_id')->constrained('parking_violations');
            $table->foreignId('appellant_id')->constrained('users');
            $table->text('reason');
            $table->json('evidence_attachments')->nullable();
            $table->enum('status', ['pending', 'reviewing', 'approved', 'rejected', 'cancelled'])->default('pending');
            $table->foreignId('reviewer_id')->nullable()->constrained('users');
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_remark')->nullable();
            $table->boolean('fine_waived')->default(false);
            $table->decimal('refund_amount', 10, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['violation_id', 'status']);
            $table->index(['appellant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('violation_appeals');
    }
};
