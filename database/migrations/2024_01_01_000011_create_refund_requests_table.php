<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('refund_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained()->onDelete('cascade');
            $table->foreignId('package_id')->constrained('member_course_packages')->onDelete('cascade');
            $table->integer('refund_lessons');
            $table->decimal('refund_amount', 10, 2);
            $table->text('reason');
            $table->string('status')->default('pending');
            $table->text('review_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->dateTime('reviewed_at')->nullable();
            $table->foreignId('submitted_by')->nullable()->constrained('users');
            $table->dateTime('withdrawn_at')->nullable();
            $table->foreignId('withdrawn_by')->nullable()->constrained('users');
            $table->boolean('coach_lessons_adjusted')->default(false);
            $table->dateTime('completed_at')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['member_id', 'status']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refund_requests');
    }
};
