<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained();
            $table->foreignId('ticket_type_id')->nullable()->constrained();
            $table->string('registration_no', 50)->unique()->comment('报名编号');
            $table->string('name', 100)->comment('姓名');
            $table->string('gender', 10)->nullable()->comment('性别');
            $table->string('phone', 20)->index()->comment('手机号');
            $table->string('email', 200)->nullable()->comment('邮箱');
            $table->string('company', 200)->nullable()->index()->comment('公司名称');
            $table->string('industry', 100)->nullable()->comment('所属行业');
            $table->string('department', 100)->nullable()->comment('部门');
            $table->string('position', 100)->nullable()->comment('职位');
            $table->string('wechat', 100)->nullable()->comment('微信号');
            $table->string('id_card', 50)->nullable()->comment('身份证号');
            $table->string('employee_no', 50)->nullable()->comment('工号');
            $table->string('source_channel', 100)->nullable()->index()->comment('来源渠道');
            $table->string('source_detail', 200)->nullable()->comment('来源详情');
            $table->text('dietary_requirement')->nullable()->comment('饮食要求');
            $table->text('remark')->nullable()->comment('备注');
            $table->jsonb('custom_fields')->nullable()->comment('自定义字段');
            $table->decimal('paid_amount', 10, 2)->default(0)->comment('实付金额');
            $table->string('payment_method', 50)->nullable()->comment('支付方式');
            $table->string('payment_no', 100)->nullable()->comment('支付单号');
            $table->dateTime('paid_at')->nullable()->index()->comment('支付时间');

            $table->enum('conversion_stage', [
                'inquiry',
                'registered',
                'confirmed',
                'paid',
                'ticket_sent',
                'lost'
            ])->default('registered')->index()->comment('转化阶段');

            $table->enum('registration_status', [
                'pending',
                'approved',
                'rejected',
                'cancelled',
                'refunded'
            ])->default('pending')->index()->comment('审核状态');

            $table->enum('attendance_status', [
                'not_arrived',
                'arrived',
                'partial',
                'no_show'
            ])->default('not_arrived')->index()->comment('到场状态');

            $table->dateTime('confirmed_at')->nullable()->index()->comment('确认时间');
            $table->dateTime('cancelled_at')->nullable()->comment('取消时间');
            $table->dateTime('approved_at')->nullable()->comment('审核时间');
            $table->unsignedBigInteger('approved_by')->nullable()->comment('审核人');
            $table->unsignedBigInteger('created_by')->comment('创建人（票务运营）');
            $table->unsignedBigInteger('updated_by')->nullable()->comment('更新人');
            $table->unsignedBigInteger('owner_id')->nullable()->comment('归属销售/跟进人');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users');
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('owner_id')->references('id')->on('users')->nullOnDelete();

            $table->index(['event_id', 'conversion_stage']);
            $table->index(['event_id', 'attendance_status']);
            $table->index(['event_id', 'created_at']);
            $table->index(['company', 'name']);
        });

        Schema::create('registration_session_pivots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained()->cascadeOnDelete();
            $table->foreignId('session_id')->constrained('event_sessions')->cascadeOnDelete();
            $table->foreignId('seat_id')->nullable()->constrained('event_seats')->nullOnDelete();
            $table->enum('attendance_status', ['not_arrived', 'arrived', 'no_show'])
                ->default('not_arrived')->index()->comment('本场次到场状态');
            $table->dateTime('checked_in_at')->nullable()->comment('签到时间');
            $table->string('check_in_method', 50)->nullable()->comment('签到方式');
            $table->unsignedBigInteger('checked_in_by')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->foreign('checked_in_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users');
            $table->unique(['registration_id', 'session_id']);
        });

        Schema::create('conversion_summaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->date('summary_date')->index()->comment('统计日期');
            $table->integer('new_inquiry_count')->default(0)->comment('新增咨询数');
            $table->integer('new_registered_count')->default(0)->comment('新增报名数');
            $table->integer('new_confirmed_count')->default(0)->comment('新增确认数');
            $table->integer('new_paid_count')->default(0)->comment('新增支付数');
            $table->integer('new_lost_count')->default(0)->comment('新增流失数');
            $table->integer('total_inquiry_count')->default(0)->comment('累计咨询数');
            $table->integer('total_registered_count')->default(0)->comment('累计报名数');
            $table->integer('total_confirmed_count')->default(0)->comment('累计确认数');
            $table->integer('total_paid_count')->default(0)->comment('累计支付数');
            $table->decimal('total_paid_amount', 12, 2)->default(0)->comment('累计支付金额');
            $table->integer('total_lost_count')->default(0)->comment('累计流失数');
            $table->decimal('conversion_rate', 5, 4)->default(0)->comment('转化率：支付/咨询');
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->foreign('created_by')->references('id')->on('users');
            $table->unique(['event_id', 'summary_date']);
        });

        Schema::create('attendance_summaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('session_id')->nullable()->constrained('event_sessions')->cascadeOnDelete();
            $table->date('summary_date')->index();
            $table->integer('registered_count')->default(0)->comment('报名人数');
            $table->integer('confirmed_count')->default(0)->comment('确认人数');
            $table->integer('arrived_count')->default(0)->comment('实到人数');
            $table->integer('no_show_count')->default(0)->comment('未到人数');
            $table->decimal('attendance_rate', 5, 4)->default(0)->comment('到场率');
            $table->decimal('arrival_rate', 5, 4)->default(0)->comment('上座率：实到/座位');
            $table->integer('seat_capacity')->default(0)->comment('座位容量');
            $table->integer('seat_sold')->default(0)->comment('已售座位');
            $table->integer('seat_occupied')->default(0)->comment('实际占用');
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->foreign('created_by')->references('id')->on('users');
            $table->unique(['event_id', 'session_id', 'summary_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_summaries');
        Schema::dropIfExists('conversion_summaries');
        Schema::dropIfExists('registration_session_pivots');
        Schema::dropIfExists('registrations');
    }
};
