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
            $table->string('key')->unique()->comment('配置键');
            $table->string('name')->comment('配置名称');
            $table->text('value')->nullable()->comment('配置值');
            $table->string('type')->default('string')->comment('值类型: string, integer, boolean, json, array');
            $table->string('category')->nullable()->comment('配置分组: approval, quotation, delivery, supply, supplier, integration, system, financial, notification');
            $table->text('description')->nullable()->comment('描述');
            $table->boolean('is_switch')->default(false)->comment('是否开关型配置');
            $table->boolean('is_public')->default(false)->comment('是否公开配置');
            $table->integer('sort')->default(0)->comment('排序');
            $table->boolean('is_active')->default(true)->comment('是否启用');
            $table->unsignedBigInteger('created_by')->nullable()->comment('创建人');
            $table->unsignedBigInteger('updated_by')->nullable()->comment('更新人');
            $table->timestamps();
            $table->softDeletes();

            $table->index('category');
            $table->index('is_switch');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_configs');
    }
};
