<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('environment_alerts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('greenhouse_id');
            $table->unsignedBigInteger('sensor_id')->nullable();
            $table->string('alert_type');
            $table->enum('severity', ['low', 'medium', 'high', 'critical']);
            $table->float('threshold_value')->nullable();
            $table->float('actual_value')->nullable();
            $table->text('message');
            $table->enum('status', ['pending', 'acknowledged', 'resolved'])->default('pending');
            $table->unsignedBigInteger('acknowledged_by')->nullable();
            $table->unsignedBigInteger('resolved_by')->nullable();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index('greenhouse_id');
            $table->index('sensor_id');
            $table->index('severity');
            $table->index('status');
            $table->index('created_at');

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
        Schema::dropIfExists('environment_alerts');
    }
};
