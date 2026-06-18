<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('machinery_appointments', function (Blueprint $table) {
            $table->id();
            $table->string('appointment_no')->unique();
            $table->unsignedBigInteger('greenhouse_id');
            $table->unsignedBigInteger('applicant_id');
            $table->string('machinery_type');
            $table->string('machinery_name');
            $table->text('purpose')->nullable();
            $table->dateTime('start_time');
            $table->dateTime('end_time');
            $table->enum('status', ['pending', 'approved', 'rejected', 'completed', 'cancelled'])->default('pending');
            $table->unsignedBigInteger('operator_id')->nullable();
            $table->text('remark')->nullable();
            $table->timestamps();

            $table->index('greenhouse_id');
            $table->index('applicant_id');
            $table->index('status');
            $table->index('start_time');
            $table->index('operator_id');

            $table->foreign('greenhouse_id')
                ->references('id')
                ->on('greenhouses')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('machinery_appointments');
    }
};
