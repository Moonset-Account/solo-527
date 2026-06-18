<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_queries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->string('name');
            $table->string('model_type');
            $table->json('query_params');
            $table->text('description')->nullable();
            $table->boolean('is_public')->default(false);
            $table->boolean('is_favorite')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->index(['user_id', 'model_type']);
            $table->index(['is_public', 'model_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_queries');
    }
};
