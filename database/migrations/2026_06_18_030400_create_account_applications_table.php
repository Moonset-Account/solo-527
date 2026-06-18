<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('applicant_id')->constrained('users');
            $table->foreignId('approver_id')->nullable()->constrained('users');
            $table->enum('application_type', ['new_account', 'permission_change', 'access_request', 'password_reset']);
            $table->string('target_system')->nullable();
            $table->text('reason');
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending');
            $table->text('approval_notes')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->index(['applicant_id', 'status']);
            $table->index(['status', 'created_at']);
            $table->index(['application_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_applications');
    }
};
