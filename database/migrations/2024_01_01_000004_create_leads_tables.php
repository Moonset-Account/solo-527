<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('phone', 20)->index();
            $table->enum('gender', ['male', 'female', 'unknown'])->default('unknown');
            $table->integer('age')->nullable();
            $table->string('source', 50)->index();
            $table->string('status', 30)->default('new')->index();
            $table->string('quality', 5)->default('C')->index();
            $table->text('intention')->nullable();
            $table->decimal('budget_min', 12, 2)->nullable();
            $table->decimal('budget_max', 12, 2)->nullable();
            $table->foreignId('quote_version_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('churn_reason_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('contract_pending_explanation')->nullable();
            $table->decimal('contract_amount', 12, 2)->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->timestamp('last_follow_at')->nullable();
            $table->timestamp('next_follow_at')->nullable();
            $table->boolean('is_in_ocean')->default(false);
            $table->timestamp('entered_ocean_at')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['status', 'quality']);
            $table->index(['source', 'status']);
            $table->index(['assignee_id', 'status']);
            $table->index(['owner_id', 'created_at']);
            $table->index(['is_in_ocean', 'next_follow_at']);
        });

        Schema::create('consultations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->onDelete('cascade');
            $table->text('content');
            $table->text('intention')->nullable();
            $table->string('quality', 5)->nullable();
            $table->timestamp('next_follow_at')->nullable();
            $table->foreignId('operator_id')->constrained('users');
            $table->timestamps();

            $table->index(['lead_id', 'created_at']);
            $table->index(['operator_id', 'created_at']);
        });

        Schema::create('response_nodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->onDelete('cascade');
            $table->string('node_type', 50);
            $table->text('content');
            $table->foreignId('operator_id')->constrained('users');
            $table->timestamps();

            $table->index(['lead_id', 'node_type', 'created_at']);
            $table->index(['operator_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('response_nodes');
        Schema::dropIfExists('consultations');
        Schema::dropIfExists('leads');
    }
};
