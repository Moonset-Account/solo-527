<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consistency_checks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('indicator_id')->constrained()->cascadeOnDelete();
            $table->string('check_type');
            $table->decimal('expected_value', 15, 4)->nullable();
            $table->decimal('actual_value', 15, 4)->nullable();
            $table->decimal('discrepancy', 15, 4)->nullable();
            $table->enum('status', ['pending', 'passed', 'failed'])->default('pending');
            $table->unsignedBigInteger('checked_by')->nullable();
            $table->timestamp('checked_at')->nullable();
            $table->json('details')->nullable();
            $table->timestamps();

            $table->foreign('checked_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consistency_checks');
    }
};
