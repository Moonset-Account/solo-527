<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kiln_batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_number')->unique();
            $table->foreignId('kiln_id')->constrained();
            $table->foreignId('firing_curve_template_id')->constrained();
            $table->foreignId('created_by')->constrained('users');
            $table->dateTime('scheduled_fire_date');
            $table->dateTime('actual_fire_date')->nullable();
            $table->dateTime('cooled_down_date')->nullable();
            $table->dateTime('unloaded_date')->nullable();
            $table->enum('status', ['draft', 'scheduled', 'firing', 'cooling', 'unloaded', 'cancelled'])->default('draft');
            $table->integer('max_capacity');
            $table->decimal('used_space_percent', 5, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['kiln_id', 'scheduled_fire_date']);
            $table->index(['status', 'scheduled_fire_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kiln_batches');
    }
};
