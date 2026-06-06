<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('works', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->foreignId('student_id')->constrained('users');
            $table->foreignId('clay_id')->constrained();
            $table->text('description')->nullable();
            $table->decimal('width', 8, 2)->nullable();
            $table->decimal('height', 8, 2)->nullable();
            $table->decimal('depth', 8, 2)->nullable();
            $table->decimal('estimated_volume', 10, 2)->nullable();
            $table->integer('temperature_zone_preference')->nullable();
            $table->enum('status', [
                'created',
                'drying',
                'bisque_fired',
                'glazing',
                'ready_for_firing',
                'scheduled',
                'in_kiln',
                'firing',
                'cooling',
                'unloaded',
                'completed',
                'broken',
                'cancelled'
            ])->default('created');
            $table->boolean('for_exhibition')->default(false);
            $table->text('breakage_reason')->nullable();
            $table->enum('compensation_status', ['none', 'pending', 'approved', 'paid', 'rejected'])->default('none');
            $table->text('compensation_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('work_glazes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('work_id')->constrained()->onDelete('cascade');
            $table->foreignId('glaze_id')->constrained();
            $table->integer('layer_number')->default(1);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['work_id', 'glaze_id', 'layer_number']);
        });

        Schema::create('kiln_batch_works', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kiln_batch_id')->constrained()->onDelete('cascade');
            $table->foreignId('work_id')->constrained()->onDelete('cascade');
            $table->integer('position_shelf')->nullable();
            $table->integer('position_zone')->nullable();
            $table->decimal('position_x', 8, 2)->nullable();
            $table->decimal('position_y', 8, 2)->nullable();
            $table->decimal('space_occupied', 10, 2)->nullable();
            $table->enum('post_firing_status', ['pending', 'success', 'broken', 'partial_damage'])->default('pending');
            $table->text('post_firing_notes')->nullable();
            $table->timestamps();
            $table->unique(['kiln_batch_id', 'work_id']);
            $table->index(['work_id', 'kiln_batch_id']);
        });

        Schema::create('work_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('work_id')->constrained()->onDelete('cascade');
            $table->string('file_path');
            $table->string('thumbnail_path')->nullable();
            $table->enum('type', ['creation', 'bisque', 'glazed', 'pre_firing', 'post_firing', 'detail']);
            $table->text('caption')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_photos');
        Schema::dropIfExists('kiln_batch_works');
        Schema::dropIfExists('work_glazes');
        Schema::dropIfExists('works');
    }
};
