<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('no_show_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('work_order_id')->constrained('work_orders')->cascadeOnDelete();
            $table->foreignId('handled_by')->constrained('users')->cascadeOnDelete();
            $table->string('handler_name');
            $table->string('reason');
            $table->unsignedInteger('contact_attempts')->default(0);
            $table->boolean('rescheduled')->nullable();
            $table->foreignId('rescheduled_order_id')->nullable()->constrained('work_orders')->nullOnDelete();
            $table->timestamp('created_at');

            $table->index('work_order_id');
            $table->index('handled_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('no_show_records');
    }
};
