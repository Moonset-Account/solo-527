<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pieces', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->string('composer', 100)->nullable();
            $table->string('instrument', 50);
            $table->string('difficulty_level', 20)->default('beginner');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('instrument', 'idx_pieces_instrument');
            $table->index('difficulty_level', 'idx_pieces_difficulty');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pieces');
    }
};
