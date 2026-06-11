<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('config_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->enum('config_type', ['cashier_order', 'service_item', 'inspection_template']);
            $table->unsignedBigInteger('config_id');
            $table->enum('action', ['create', 'update', 'delete']);
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->foreignId('changed_by')->constrained('users')->cascadeOnDelete();
            $table->string('changed_by_name');
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at');

            $table->index('config_type');
            $table->index('config_id');
            $table->index('changed_by');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('config_audit_logs');
    }
};
