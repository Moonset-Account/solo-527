<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_flows', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique()->comment('流程编码');
            $table->string('name')->comment('流程名称');
            $table->string('entity_type')->comment('关联类型: purchase_request, quotation, etc.');
            $table->string('trigger_condition')->nullable()->comment('触发条件(JSON)');
            $table->text('description')->nullable()->comment('描述');
            $table->boolean('is_active')->default(true)->comment('是否启用');
            $table->integer('sort')->default(0)->comment('排序');
            $table->unsignedBigInteger('created_by')->nullable()->comment('创建人');
            $table->unsignedBigInteger('updated_by')->nullable()->comment('更新人');
            $table->timestamps();
            $table->softDeletes();

            $table->index('entity_type');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_flows');
    }
};
