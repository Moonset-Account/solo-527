<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name')->comment('项目名称');
            $table->string('customer')->comment('客户名称');
            $table->decimal('amount', 15, 2)->comment('项目金额');
            $table->string('project_manager')->comment('项目经理');
            $table->text('description')->nullable()->comment('项目描述');
            $table->date('start_date')->nullable()->comment('开始日期');
            $table->date('end_date')->nullable()->comment('结束日期');
            $table->string('status')->default('active')->comment('项目状态');
            $table->softDeletes();
            $table->timestamps();

            $table->index('name');
            $table->index('customer');
            $table->index('project_manager');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
