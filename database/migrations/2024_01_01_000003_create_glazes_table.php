<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('glazes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('color');
            $table->text('description')->nullable();
            $table->integer('firing_temp_min');
            $table->integer('firing_temp_max');
            $table->enum('atmosphere', ['oxidation', 'reduction', 'neutral'])->default('oxidation');
            $table->enum('finish', ['glossy', 'matte', 'satin', 'textured'])->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('glaze_compatibilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('glaze1_id')->constrained('glazes')->onDelete('cascade');
            $table->foreignId('glaze2_id')->constrained('glazes')->onDelete('cascade');
            $table->enum('compatibility', ['compatible', 'incompatible', 'caution']);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['glaze1_id', 'glaze2_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('glaze_compatibilities');
        Schema::dropIfExists('glazes');
    }
};
