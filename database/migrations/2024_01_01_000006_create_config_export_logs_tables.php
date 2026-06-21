<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('config_group', 50)->index()->comment('配置分组');
            $table->string('config_key', 100)->comment('配置键');
            $table->text('config_value')->nullable()->comment('配置值');
            $table->string('value_type', 20)->default('string')->comment('值类型:string/boolean/number/json');
            $table->string('title', 200)->comment('配置标题');
            $table->text('description')->nullable()->comment('说明');
            $table->boolean('is_public')->default(false)->comment('是否公开');
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
            $table->unique(['event_id', 'config_group', 'config_key']);
        });

        Schema::create('export_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->nullable()->constrained()->nullOnDelete();
            $table->string('export_type', 50)->index()->comment('导出类型:registrations/summary/attendance/refund');
            $table->string('file_name', 500)->comment('文件名');
            $table->string('file_path', 1000)->comment('文件路径');
            $table->string('file_format', 20)->default('xlsx')->comment('格式xlsx/csv');
            $table->unsignedBigInteger('record_count')->default(0)->comment('导出记录数');
            $table->unsignedBigInteger('file_size')->default(0)->comment('文件大小字节');

            $table->jsonb('query_criteria')->comment('查询口径/查询条件');
            $table->jsonb('export_columns')->nullable()->comment('导出列');
            $table->text('sql_hash')->nullable()->comment('SQL签名防篡改');

            $table->unsignedBigInteger('exported_by')->comment('导出人ID');
            $table->string('exported_by_name', 100)->comment('导出人姓名快照');
            $table->string('exported_by_dept', 100)->nullable()->comment('导出人部门快照');
            $table->ipAddress('exported_from_ip')->nullable()->comment('导出IP');
            $table->dateTime('expired_at')->nullable()->comment('过期时间');
            $table->enum('status', ['generating', 'completed', 'failed', 'expired'])->default('generating')->index();
            $table->unsignedBigInteger('download_count')->default(0)->comment('下载次数');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('exported_by')->references('id')->on('users');
            $table->index(['exported_by', 'created_at']);
            $table->index(['event_id', 'export_type', 'created_at']);
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('log_name', 100)->nullable()->index()->comment('日志分类');
            $table->text('description')->comment('操作描述');
            $table->string('subject_type', 150)->nullable()->index();
            $table->unsignedBigInteger('subject_id')->nullable()->index();
            $table->string('causer_type', 150)->nullable()->index();
            $table->unsignedBigInteger('causer_id')->nullable()->index();
            $table->jsonb('properties')->nullable()->comment('变更前后属性');
            $table->jsonb('old_values')->nullable()->comment('变更前');
            $table->jsonb('new_values')->nullable()->comment('变更后');
            $table->string('batch_uuid', 36)->nullable()->index()->comment('批次UUID');
            $table->string('event', 50)->nullable()->comment('事件类型:created/updated/deleted');
            $table->unsignedBigInteger('causer_impersonator_id')->nullable()->index()->comment('模拟人ID');
            $table->string('method', 20)->nullable()->comment('请求方法');
            $table->text('url')->nullable()->comment('请求URL');
            $table->ipAddress('ip')->nullable()->comment('IP地址');
            $table->text('user_agent')->nullable()->comment('User Agent');
            $table->timestamps();

            $table->index(['created_at']);
            $table->index(['causer_id', 'causer_type', 'log_name']);
        });

        Schema::create('notification_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type', 50)->index()->comment('类型:todo/alert/info');
            $table->string('title', 200)->comment('标题');
            $table->text('content')->comment('内容');
            $table->morphs('notifiable');
            $table->unsignedBigInteger('related_id')->nullable()->comment('关联业务ID');
            $table->string('related_type', 100)->nullable()->comment('关联业务类型');
            $table->timestamp('read_at')->nullable()->index();
            $table->timestamp('sent_at')->nullable()->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_records');
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('export_records');
        Schema::dropIfExists('system_configs');
    }
};
