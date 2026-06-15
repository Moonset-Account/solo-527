<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('compliance_gaps', function (Blueprint $table) {
            $table->id();
            $table->string('gap_no')->unique();
            $table->foreignId('checklist_record_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('checklist_item_id')->nullable()->constrained();
            $table->string('source_type')->default('manual'); // manual, checklist, audit, external, incident
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('severity')->default('medium');
            $table->string('status')->default('open');
            $table->string('category')->nullable();
            $table->foreignId('responsible_user_id')->nullable()->constrained('users');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('closed_by')->nullable()->constrained('users');
            $table->date('discovered_date');
            $table->date('due_date')->nullable();
            $table->date('closed_date')->nullable();
            $table->text('root_cause')->nullable();
            $table->text('corrective_action')->nullable();
            $table->text('preventive_action')->nullable();
            $table->text('resolution_summary')->nullable();
            $table->integer('review_duration_hours')->default(0);
            $table->integer('handling_duration_hours')->default(0);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['status', 'severity']);
            $table->index(['responsible_user_id', 'status']);
            $table->index(['due_date', 'status']);
            $table->index(['category', 'status']);
            $table->index(['source_type', 'status']);
        });

        Schema::create('gap_handling_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('compliance_gap_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users');
            $table->string('action_type');
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
            $table->text('comment')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['compliance_gap_id', 'created_at']);
        });

        Schema::create('gap_evidences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('compliance_gap_id')->constrained()->onDelete('cascade');
            $table->foreignId('uploaded_by')->constrained('users');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_size')->nullable();
            $table->string('file_type')->nullable();
            $table->text('description')->nullable();
            $table->string('evidence_type')->nullable(); // 整改证据、佐证材料等
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gap_evidences');
        Schema::dropIfExists('gap_handling_logs');
        Schema::dropIfExists('compliance_gaps');
    }
};
