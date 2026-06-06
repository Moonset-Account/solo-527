<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('size');
            $table->decimal('price', 10, 2);
            $table->decimal('deposit', 10, 2)->default(0);
            $table->string('flavor');
            $table->boolean('is_active')->default(true);
            $table->integer('preparation_hours')->default(24);
            $table->string('image')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['name', 'size', 'flavor']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
