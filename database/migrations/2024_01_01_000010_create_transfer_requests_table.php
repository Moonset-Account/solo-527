<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transfer_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained()->onDelete('cascade');
            $table->foreignId('from_coach_id')->constrained('coaches')->onDelete('cascade');
            $table->foreignId('to_coach_id')->constrained('coaches')->onDelete('cascade');
            $table->foreignId('course_type_id')->constrained()->onDelete('cascade');
            $table->integer('lessons_count');
            $table->text('reason')->nullable();
            $table->string('status')->default('pending');
            $table->text('review_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->dateTime('reviewed_at')->nullable();
            $table->foreignId('submitted_by')->nullable()->constrained('users');
            $table->dateTime('withdrawn_at')->nullable();
            $table->foreignId('withdrawn_by')->nullable()->constrained('users');
            $table->boolean('coach_adjusted')->default(false);
            $table->boolean('store_revenue_adjusted')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['member_id', 'status']);
            $table->index(['from_coach_id', 'status']);
            $table->index(['to_coach_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfer_requests');
    }
};
