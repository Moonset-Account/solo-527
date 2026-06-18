<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('environment_data', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('greenhouse_id');
            $table->unsignedBigInteger('sensor_id')->nullable();
            $table->float('temperature')->nullable();
            $table->float('humidity')->nullable();
            $table->float('soil_moisture')->nullable();
            $table->float('light_intensity')->nullable();
            $table->float('co2_level')->nullable();
            $table->float('ph_value')->nullable();
            $table->boolean('is_anomaly')->default(false);
            $table->string('anomaly_type')->nullable();
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->index('greenhouse_id');
            $table->index('sensor_id');
            $table->index('recorded_at');
            $table->index(['greenhouse_id', 'recorded_at']);
            $table->index('is_anomaly');

            $table->foreign('greenhouse_id')
                ->references('id')
                ->on('greenhouses')
                ->onDelete('cascade');

            $table->foreign('sensor_id')
                ->references('id')
                ->on('environment_sensors')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('environment_data');
    }
};
