<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('environment_sensors', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('greenhouse_id');
            $table->string('code')->unique();
            $table->enum('type', ['temperature', 'humidity', 'soil_moisture', 'light', 'co2', 'ph']);
            $table->string('unit');
            $table->string('status')->default('active');
            $table->timestamps();

            $table->index('greenhouse_id');
            $table->index('type');
            $table->index('status');

            $table->foreign('greenhouse_id')
                ->references('id')
                ->on('greenhouses')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('environment_sensors');
    }
};
