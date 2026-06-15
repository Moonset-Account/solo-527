<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reminder_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('type'); // gap_due, gap_overdue, checklist_due, review_pending
            $table->string('trigger_condition'); // before_due, after_due, immediate, daily
            $table->integer('trigger_value')->default(0); // 触发值（天数等）
            $table->string('time_unit')->default('day'); // minute, hour, day, week
            $table->string('channel')->default('email'); // email, in_app, sms
            $table->json('recipient_roles')->nullable(); // 接收角色
            $table->json('recipient_user_ids')->nullable(); // 指定接收人
            $table->string('template')->nullable(); // 消息模板
            $table->boolean('is_enabled')->default(true);
            $table->string('priority')->default('normal'); // low, normal, high, urgent
            $table->integer('max_reminders')->default(0); // 最大提醒次数，0为无限
            $table->integer('reminder_interval_hours')->default(24); // 提醒间隔
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('reminder_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reminder_rule_id')->nullable()->constrained();
            $table->string('type');
            $table->morphs('notifiable'); // 关联的对象（gap, checklist等）
            $table->foreignId('recipient_id')->constrained('users');
            $table->string('channel');
            $table->string('title');
            $table->text('content')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->string('status')->default('pending'); // pending, sent, failed, read
            $table->timestamps();
            $table->index(['recipient_id', 'read_at']);
            $table->index(['type', 'status']);
        });

        Schema::create('saved_filters', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('page'); // 适用页面: gaps, checklists, records
            $table->json('filters');
            $table->boolean('is_public')->default(false);
            $table->foreignId('user_id')->constrained('users');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['user_id', 'page']);
            $table->index(['page', 'is_public']);
        });

        Schema::create('download_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->string('download_type'); // gap_report, checklist, evidence, compliance_summary
            $table->morphs('downloadable');
            $table->string('file_name');
            $table->string('file_format')->default('pdf'); // pdf, excel, csv
            $table->bigInteger('file_size')->default(0);
            $table->json('filter_criteria')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
            $table->index(['download_type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('download_logs');
        Schema::dropIfExists('saved_filters');
        Schema::dropIfExists('reminder_logs');
        Schema::dropIfExists('reminder_rules');
    }
};
