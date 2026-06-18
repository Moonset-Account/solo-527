<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_filters', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('role_id')->nullable();
            $table->string('name');
            $table->string('module');
            $table->json('filters');
            $table->boolean('is_public')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('user_id');
            $table->index('role_id');
            $table->index('module');
            $table->index('is_public');
            $table->index(['user_id', 'module']);
            $table->index(['role_id', 'module']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_filters');
    }
};
