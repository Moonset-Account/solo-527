<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspection_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alert_id')->nullable()->constrained('alerts');
            $table->foreignId('user_id')->constrained('users');
            $table->string('check_item');
            $table->enum('status', ['pass', 'fail', 'warning', 'skipped', 'missed'])->default('pass');
            $table->text('notes')->nullable();
            $table->json('check_details')->nullable();
            $table->timestamp('checked_at')->nullable();
            $table->boolean('was_missed')->default(false);
            $table->text('missed_reason')->nullable();
            $table->timestamps();
            $table->index(['alert_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index(['status', 'was_missed']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspection_records');
    }
};
