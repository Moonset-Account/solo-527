<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('plate_number');
            $table->string('make');
            $table->string('model');
            $table->unsignedSmallInteger('year')->nullable();
            $table->string('color')->nullable();
            $table->string('owner_name');
            $table->string('owner_phone');
            $table->string('owner_id_number')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique('plate_number');
            $table->index('owner_phone');
            $table->index('owner_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
