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
            $table->string('gap_no')->unique(); // 缺口编号
            $table->foreignId('checklist_record_id')->constrained()->onDelete('cascade');
            $table->foreignId('checklist_item_id')->nullable()->constrained();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('severity')->default('medium'); // low, medium, high, critical
            $table->string('status')->default('open'); // open, in_progress, pending_review, resolved, closed
            $table->string('category')->nullable(); // 分类
            $table->foreignId('responsible_user_id')->nullable()->constrained('users');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('closed_by')->nullable()->constrained('users');
            $table->date('discovered_date');
            $table->date('due_date')->nullable(); // 整改期限
            $table->date('closed_date')->nullable();
            $table->text('root_cause')->nullable();
            $table->text('corrective_action')->nullable(); // 整改措施
            $table->text('preventive_action')->nullable(); // 预防措施
            $table->text('resolution_summary')->nullable();
            $table->integer('review_duration_hours')->default(0); // 审阅时长（小时）
            $table->integer('handling_duration_hours')->default(0); // 处理时长（小时）
            $table->timestamps();
            $table->softDeletes();
            $table->index(['status', 'severity']);
            $table->index(['responsible_user_id', 'status']);
            $table->index(['due_date', 'status']);
            $table->index(['category', 'status']);
        });

        Schema::create('gap_handling_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('compliance_gap_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users');
            $table->string('action_type'); // created, status_changed, comment, evidence_added, assignee_changed, due_date_changed
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
