<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dataset_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('dataset_name');
            $table->timestamp('expires_at')->nullable();
            $table->unsignedBigInteger('granted_by');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('granted_by')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dataset_permissions');
    }
};
