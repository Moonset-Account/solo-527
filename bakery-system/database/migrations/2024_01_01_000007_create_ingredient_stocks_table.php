<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredient_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained()->onDelete('cascade');
            $table->decimal('quantity', 10, 2);
            $table->date('expiry_date')->nullable();
            $table->string('batch_number')->nullable();
            $table->string('supplier')->nullable();
            $table->decimal('unit_cost', 10, 2)->nullable();
            $table->timestamps();

            $table->index('expiry_date');
            $table->index(['ingredient_id', 'expiry_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredient_stocks');
    }
};
