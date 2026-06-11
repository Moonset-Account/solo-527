<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quality_reports', function (Blueprint $table) {
            $table->id();
            $table->date('report_date');
            $table->foreignId('work_order_id')->constrained('work_orders')->cascadeOnDelete();
            $table->foreignId('vehicle_id')->constrained('vehicles')->cascadeOnDelete();
            $table->foreignId('technician_id')->nullable()->constrained('technicians')->nullOnDelete();
            $table->string('service_item');
            $table->unsignedInteger('inspection_pass_count')->default(0);
            $table->unsignedInteger('inspection_fail_count')->default(0);
            $table->unsignedInteger('inspection_warning_count')->default(0);
            $table->boolean('no_show')->default(false);
            $table->string('no_show_reason')->nullable();
            $table->decimal('overall_score', 5, 2)->default(0);
            $table->text('remarks')->nullable();
            $table->foreignId('generated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('report_date');
            $table->index('work_order_id');
            $table->index('vehicle_id');
            $table->index('technician_id');
            $table->index('generated_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quality_reports');
    }
};
