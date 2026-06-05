<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_flows', function (Blueprint $table) {
            $table->id();
            $table->string('approvable_type', 100);
            $table->unsignedBigInteger('approvable_id');
            $table->unsignedBigInteger('approver_user_id');
            $table->string('action', 20);
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->foreign('approver_user_id')->references('id')->on('users')->onDelete('cascade');

            $table->index(['approvable_type', 'approvable_id'], 'idx_approvals_morph');
            $table->index('approver_user_id', 'idx_approvals_approver');
            $table->index('action', 'idx_approvals_action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_flows');
    }
};
