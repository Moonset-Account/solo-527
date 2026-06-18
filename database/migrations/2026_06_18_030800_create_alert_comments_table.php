<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alert_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alert_id')->constrained('alerts')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users');
            $table->text('content');
            $table->enum('type', ['comment', 'status_change', 'escalation', 'resolution'])->default('comment');
            $table->timestamps();
            $table->index(['alert_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alert_comments');
    }
};
