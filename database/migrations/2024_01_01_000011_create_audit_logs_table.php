<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('operator')->comment('操作人');
            $table->string('operation_type')->comment('操作类型');
            $table->text('change_content')->comment('变更内容');
            $table->timestamp('timestamp')->useCurrent()->comment('时间戳');
            $table->string('resource_type')->nullable()->comment('资源类型');
            $table->unsignedBigInteger('resource_id')->nullable()->comment('资源ID');
            $table->string('ip_address')->nullable()->comment('IP地址');
            $table->string('user_agent')->nullable()->comment('用户代理');
            $table->text('metadata')->nullable()->comment('元数据');

            $table->index('operator');
            $table->index('operation_type');
            $table->index('timestamp');
            $table->index(['resource_type', 'resource_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
