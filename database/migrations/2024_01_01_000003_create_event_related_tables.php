<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('name', 200)->comment('活动名称');
            $table->string('theme', 255)->nullable()->comment('活动主题');
            $table->text('description')->nullable()->comment('活动描述');
            $table->string('location', 255)->nullable()->comment('活动地点');
            $table->string('address', 500)->nullable()->comment('详细地址');
            $table->dateTime('start_time')->index()->comment('开始时间');
            $table->dateTime('end_time')->index()->comment('结束时间');
            $table->string('organizer', 200)->nullable()->comment('主办方');
            $table->string('undertaker', 200)->nullable()->comment('承办方');
            $table->integer('expected_count')->default(0)->comment('预计人数');
            $table->string('cover_image', 500)->nullable()->comment('封面图');
            $table->jsonb('tags')->nullable()->comment('活动标签');
            $table->enum('status', ['draft', 'registering', 'ongoing', 'completed', 'cancelled'])
                ->default('draft')->index()->comment('状态');
            $table->unsignedBigInteger('created_by')->comment('创建人');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('created_by')->references('id')->on('users');
        });

        Schema::create('event_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->string('name', 200)->comment('场次名称');
            $table->string('venue', 200)->nullable()->comment('分会场/场地');
            $table->dateTime('start_time')->index()->comment('场次开始时间');
            $table->dateTime('end_time')->index()->comment('场次结束时间');
            $table->string('speaker', 200)->nullable()->comment('主讲嘉宾');
            $table->text('agenda')->nullable()->comment('议程');
            $table->integer('capacity')->default(0)->comment('容量');
            $table->integer('seat_count')->default(0)->comment('可售座位数');
            $table->integer('sort_order')->default(0)->comment('排序');
            $table->boolean('is_active')->default(true)->index()->comment('是否启用');
            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('created_by')->references('id')->on('users');
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('event_seats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('session_id')->nullable()->constrained('event_sessions')->nullOnDelete();
            $table->string('zone', 50)->nullable()->comment('区域:A/B/C/VIP');
            $table->string('row', 20)->nullable()->comment('排号');
            $table->string('seat_no', 50)->comment('座位号');
            $table->decimal('price', 10, 2)->default(0)->comment('价格');
            $table->enum('level', ['normal', 'vip', 'vvip', 'guest'])->default('normal')->comment('座位等级');
            $table->enum('status', ['available', 'locked', 'sold', 'reserved', 'disabled'])
                ->default('available')->index()->comment('座位状态');
            $table->text('remark')->nullable()->comment('备注');
            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('created_by')->references('id')->on('users');
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
            $table->unique(['session_id', 'zone', 'row', 'seat_no'], 'session_seat_unique');
        });

        Schema::create('ticket_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100)->comment('票种名称');
            $table->text('description')->nullable()->comment('票种说明');
            $table->decimal('price', 10, 2)->default(0)->comment('票价');
            $table->decimal('original_price', 10, 2)->default(0)->comment('原价');
            $table->integer('total_count')->default(0)->comment('总票数');
            $table->integer('sold_count')->default(0)->comment('已售数量');
            $table->dateTime('sale_start_time')->nullable()->comment('开售时间');
            $table->dateTime('sale_end_time')->nullable()->comment('截止时间');
            $table->boolean('is_active')->default(true)->comment('是否启用');
            $table->unsignedBigInteger('created_by');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('created_by')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_types');
        Schema::dropIfExists('event_seats');
        Schema::dropIfExists('event_sessions');
        Schema::dropIfExists('events');
    }
};
