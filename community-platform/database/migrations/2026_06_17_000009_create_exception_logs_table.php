<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exception_logs', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['notification', 'payment']);
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('error_message');
            $table->enum('status', ['pending', 'resolved'])->default('pending');
            $table->unsignedBigInteger('resolved_by')->nullable();
            $table->dateTime('resolved_at')->nullable();
            $table->unsignedInteger('retry_count')->default(0);
            $table->json('payload')->nullable();
            $table->timestamps();

            $table->foreign('resolved_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exception_logs');
    }
};
