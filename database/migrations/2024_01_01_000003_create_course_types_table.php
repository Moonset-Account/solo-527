<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('duration_minutes')->default(60);
            $table->decimal('price', 10, 2)->default(0);
            $table->decimal('coach_commission', 10, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('color')->nullable();
            $table->text('cover_image')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_types');
    }
};
