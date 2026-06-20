<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consultant_follow_ups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            $table->foreignId('consultant_id')->constrained('users');
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->string('type')->default('visit');
            $table->text('content');
            $table->timestamp('followed_up_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultant_follow_ups');
    }
};
