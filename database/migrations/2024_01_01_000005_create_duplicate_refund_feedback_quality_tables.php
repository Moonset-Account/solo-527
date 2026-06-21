<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('duplicate_seat_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained();
            $table->foreignId('session_id')->nullable()->constrained('event_sessions')->nullOnDelete();
            $table->foreignId('seat_id')->nullable()->constrained('event_seats')->nullOnDelete();
            $table->string('phone', 20)->nullable()->index()->comment('冲突手机号');
            $table->string('company', 200)->nullable()->index()->comment('冲突公司');
            $table->string('conflict_type', 50)->index()->comment('冲突类型:seat/phone/company/person');
            $table->text('conflict_reason')->nullable()->comment('冲突描述');
            $table->jsonb('conflict_registration_ids')->comment('冲突的报名ID列表');
            $table->jsonb('conflict_details')->nullable()->comment('冲突详情快照');

            $table->enum('status', [
                'pending',
                'processing',
                'resolved_keep_first',
                'resolved_keep_last',
                'resolved_merge',
                'resolved_cancel_all',
                'resolved_manual',
                'closed'
            ])->default('pending')->index()->comment('处理状态');

            $table->text('resolution_note')->nullable()->comment('处理说明');
            $table->unsignedBigInteger('final_registration_id')->nullable()->comment('最终保留的报名ID');
            $table->unsignedBigInteger('assigned_to')->nullable()->comment('指派处理人');
            $table->dateTime('resolved_at')->nullable()->index()->comment('处理时间');
            $table->unsignedBigInteger('resolved_by')->nullable()->comment('处理人');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('assigned_to')->references('id')->on('users')->nullOnDelete();
            $table->foreign('resolved_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();

            $table->index(['event_id', 'status']);
        });

        Schema::create('refund_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained();
            $table->foreignId('event_id')->constrained();
            $table->string('refund_no', 50)->unique()->comment('退款单号');
            $table->decimal('requested_amount', 10, 2)->default(0)->comment('申请退款金额');
            $table->decimal('actual_amount', 10, 2)->default(0)->comment('实际退款金额');
            $table->text('reason')->comment('退款原因');
            $table->string('applicant_name', 100)->nullable()->comment('申请人');
            $table->string('applicant_phone', 20)->nullable()->comment('申请人电话');
            $table->string('refund_method', 50)->nullable()->comment('退款方式');
            $table->string('refund_account', 200)->nullable()->comment('退款账户');

            $table->enum('status', [
                'pending',
                'approved',
                'rejected',
                'processing',
                'completed',
                'cancelled'
            ])->default('pending')->index()->comment('状态');

            $table->text('review_note')->nullable()->comment('审核意见');
            $table->text('process_note')->nullable()->comment('处理备注');
            $table->dateTime('reviewed_at')->nullable()->comment('审核时间');
            $table->dateTime('completed_at')->nullable()->comment('完成时间');
            $table->unsignedBigInteger('reviewed_by')->nullable()->comment('审核人');
            $table->unsignedBigInteger('processed_by')->nullable()->comment('处理人');
            $table->unsignedBigInteger('created_by')->comment('提交人');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('reviewed_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('processed_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users');
            $table->index(['event_id', 'status']);
        });

        Schema::create('attendance_feedbacks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('event_id')->constrained();
            $table->foreignId('session_id')->nullable()->constrained('event_sessions')->nullOnDelete();
            $table->unsignedTinyInteger('overall_rating')->nullable()->comment('整体评分1-5');
            $table->unsignedTinyInteger('content_rating')->nullable()->comment('内容评分');
            $table->unsignedTinyInteger('venue_rating')->nullable()->comment('场地评分');
            $table->unsignedTinyInteger('service_rating')->nullable()->comment('服务评分');
            $table->unsignedTinyInteger('organization_rating')->nullable()->comment('组织评分');
            $table->text('content_feedback')->nullable()->comment('内容反馈');
            $table->text('improvement_suggestion')->nullable()->comment('改进建议');
            $table->text('good_points')->nullable()->comment('好评点');
            $table->text('other_comments')->nullable()->comment('其他评价');
            $table->jsonb('custom_feedback')->nullable()->comment('自定义反馈');
            $table->boolean('is_willing_next_time')->nullable()->comment('是否愿意下次参加');
            $table->boolean('would_recommend')->nullable()->comment('是否愿意推荐');
            $table->boolean('is_anonymous')->default(false)->comment('是否匿名');
            $table->string('status', 20)->default('submitted')->comment('状态');
            $table->unsignedBigInteger('submitted_by')->nullable()->comment('提交人');
            $table->timestamps();

            $table->foreign('submitted_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['event_id', 'created_at']);
        });

        Schema::create('registration_quality_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('information_completeness')->default(0)->comment('信息完整度0-100');
            $table->unsignedTinyInteger('position_level_score')->default(0)->comment('职位级别分');
            $table->unsignedTinyInteger('company_quality_score')->default(0)->comment('公司质量分');
            $table->unsignedTinyInteger('industry_match_score')->default(0)->comment('行业匹配度');
            $table->unsignedTinyInteger('history_score')->default(0)->comment('历史行为分');
            $table->unsignedTinyInteger('total_score')->default(0)->index()->comment('总分0-100');
            $table->enum('quality_level', ['S', 'A', 'B', 'C', 'D'])->index()->comment('质量等级');
            $table->text('score_remark')->nullable()->comment('评分说明');
            $table->boolean('is_key_customer')->default(false)->index()->comment('是否重点客户');
            $table->boolean('is_vip')->default(false)->index()->comment('是否VIP');
            $table->unsignedBigInteger('scored_by')->nullable();
            $table->timestamps();

            $table->foreign('scored_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['event_id', 'quality_level']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registration_quality_scores');
        Schema::dropIfExists('attendance_feedbacks');
        Schema::dropIfExists('refund_requests');
        Schema::dropIfExists('duplicate_seat_records');
    }
};
