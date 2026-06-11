<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_no')->unique();
            $table->foreignId('vehicle_id')->constrained('vehicles')->cascadeOnDelete();
            $table->foreignId('technician_id')->nullable()->constrained('technicians')->nullOnDelete();
            $table->foreignId('station_id')->nullable()->constrained('work_stations')->nullOnDelete();
            $table->foreignId('service_item_id')->constrained('service_items')->cascadeOnDelete();
            $table->foreignId('inspection_template_id')->nullable()->constrained('inspection_templates')->nullOnDelete();
            $table->enum('status', ['pending', 'confirmed', 'in_progress', 'completed', 'no_show', 'cancelled', 'paid'])->default('pending');
            $table->timestamp('scheduled_time')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->string('payment_method')->nullable();
            $table->enum('payment_status', ['unpaid', 'partial', 'paid'])->default('unpaid');
            $table->timestamp('payment_paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('payment_status');
            $table->index('scheduled_time');
            $table->index('vehicle_id');
            $table->index('technician_id');
            $table->index('station_id');
            $table->index('service_item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_orders');
    }
};
