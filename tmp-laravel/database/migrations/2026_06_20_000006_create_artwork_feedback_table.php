<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('artwork_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('artwork_id')->constrained('artworks');
            $table->foreignId('teacher_id')->constrained('users');
            $table->text('content');
            $table->decimal('score', 5, 2)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('artwork_feedback');
    }
};
