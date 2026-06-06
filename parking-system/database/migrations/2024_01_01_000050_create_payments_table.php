<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_no', 64)->unique();
            $table->foreignId('booking_id')->constrained('bookings');
            $table->foreignId('user_id')->constrained('users');
            $table->decimal('amount', 10, 2);
            $table->enum('type', ['booking', 'fine', 'deposit', 'refund']);
            $table->enum('method', ['wechat', 'alipay', 'cash', 'card', 'balance']);
            $table->enum('status', ['pending', 'success', 'failed', 'refunded', 'partial_refund'])->default('pending');
            $table->string('third_party_no', 128)->nullable();
            $table->text('callback_data')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->text('remark')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['booking_id', 'status']);
            $table->index(['user_id', 'type']);
            $table->index(['transaction_no']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
