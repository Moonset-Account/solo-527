<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_revenue_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->nullable()->constrained('members')->onDelete('set null');
            $table->foreignId('transfer_request_id')->nullable()->constrained('transfer_requests')->onDelete('set null');
            $table->foreignId('refund_request_id')->nullable()->constrained('refund_requests')->onDelete('set null');
            $table->foreignId('package_id')->nullable()->constrained('member_course_packages')->onDelete('set null');
            $table->string('type');
            $table->decimal('amount', 10, 2);
            $table->text('description')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();

            $table->index(['type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_revenue_logs');
    }
};
