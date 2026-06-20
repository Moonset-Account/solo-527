<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stage_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('art_class_id')->constrained('art_classes');
            $table->string('title');
            $table->enum('stage_type', ['weekly', 'monthly', 'phase']);
            $table->date('start_date');
            $table->date('end_date');
            $table->json('config')->nullable();
            $table->enum('status', ['draft', 'generated', 'published'])->default('draft');
            $table->timestamp('generated_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stage_reports');
    }
};
