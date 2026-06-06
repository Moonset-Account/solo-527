<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('zone')->nullable()->comment('库区');
            $table->string('aisle')->nullable()->comment('通道');
            $table->string('shelf')->nullable()->comment('货架');
            $table->string('level')->nullable()->comment('层');
            $table->string('position')->nullable()->comment('位');
            $table->string('type')->default('normal')->comment('normal:普通,bulk:大宗,cold:冷藏,dangerous:危险品');
            $table->decimal('capacity', 10, 2)->nullable();
            $table->string('capacity_unit')->default('件');
            $table->boolean('is_active')->default(true);
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('locations');
    }
};
