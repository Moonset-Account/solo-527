<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('firing_curve_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('max_temperature');
            $table->enum('atmosphere', ['oxidation', 'reduction', 'neutral'])->default('oxidation');
            $table->integer('total_duration_minutes');
            $table->foreignId('created_by')->constrained('users');
            $table->boolean('is_public')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('firing_curve_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('firing_curve_template_id')->constrained()->onDelete('cascade');
            $table->integer('time_minutes');
            $table->integer('temperature');
            $table->string('segment_type')->default('ramp');
            $table->text('notes')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('firing_curve_points');
        Schema::dropIfExists('firing_curve_templates');
    }
};
