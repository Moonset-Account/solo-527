<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('public_notices', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content');
            $table->enum('type', ['grid_event', 'assistance', 'issue']);
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->unsignedBigInteger('published_by');
            $table->dateTime('published_at');
            $table->timestamps();

            $table->foreign('published_by')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public_notices');
    }
};
