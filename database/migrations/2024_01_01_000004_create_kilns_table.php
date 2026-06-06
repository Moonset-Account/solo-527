<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kilns', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->integer('capacity');
            $table->decimal('width', 8, 2);
            $table->decimal('height', 8, 2);
            $table->decimal('depth', 8, 2);
            $table->integer('temp_max');
            $table->json('temperature_zones');
            $table->enum('type', ['electric', 'gas', 'wood'])->default('electric');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('kiln_maintenance_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kiln_id')->constrained()->onDelete('cascade');
            $table->date('maintenance_date');
            $table->text('reason')->nullable();
            $table->boolean('is_recurring_weekly')->default(false);
            $table->integer('day_of_week')->nullable();
            $table->timestamps();
            $table->index(['kiln_id', 'maintenance_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kiln_maintenance_days');
        Schema::dropIfExists('kilns');
    }
};
