<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coaches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->onDelete('cascade');
            $table->string('employee_no')->unique();
            $table->string('gender')->nullable();
            $table->text('specialties')->nullable();
            $table->text('certifications')->nullable();
            $table->integer('experience_years')->default(0);
            $table->text('bio')->nullable();
            $table->decimal('rating', 3, 2)->default(5.00);
            $table->integer('total_students')->default(0);
            $table->integer('total_lessons')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coaches');
    }
};
