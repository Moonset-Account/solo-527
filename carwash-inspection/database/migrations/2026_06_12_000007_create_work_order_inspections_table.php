<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work_order_inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('work_order_id')->constrained('work_orders')->cascadeOnDelete();
            $table->foreignId('inspection_template_id')->constrained('inspection_templates')->cascadeOnDelete();
            $table->string('item_name');
            $table->string('category');
            $table->enum('result', ['pass', 'fail', 'warning', 'skip']);
            $table->text('remarks')->nullable();
            $table->foreignId('inspected_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('inspected_at');

            $table->index('work_order_id');
            $table->index('inspection_template_id');
            $table->index('result');
            $table->index('inspected_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_order_inspections');
    }
};
