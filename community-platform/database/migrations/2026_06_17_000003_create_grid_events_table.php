<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grid_events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('location')->nullable();
            $table->enum('status', ['pending', 'processing', 'resolved', 'closed'])->default('pending');
            $table->unsignedBigInteger('reporter_id');
            $table->unsignedBigInteger('handler_id')->nullable();
            $table->unsignedBigInteger('department_id')->nullable();
            $table->dateTime('event_time');
            $table->dateTime('resolved_at')->nullable();
            $table->timestamps();

            $table->foreign('reporter_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('handler_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('department_id')->references('id')->on('departments')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grid_events');
    }
};
