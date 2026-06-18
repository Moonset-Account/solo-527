<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('escalation_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('level', ['critical', 'warning', 'info', 'debug'])->default('critical');
            $table->integer('wait_minutes')->default(15);
            $table->integer('escalation_level')->default(1);
            $table->json('notification_channels')->nullable();
            $table->json('notify_roles')->nullable();
            $table->json('notify_user_ids')->nullable();
            $table->boolean('is_enabled')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->index(['level', 'escalation_level']);
            $table->index(['is_enabled']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('escalation_rules');
    }
};
