<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supply_categories', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique()->comment('分类编码');
            $table->string('name')->comment('分类名称');
            $table->unsignedBigInteger('parent_id')->nullable()->comment('父级分类ID');
            $table->integer('level')->default(1)->comment('层级');
            $table->string('path')->nullable()->comment('层级路径');
            $table->integer('sort')->default(0)->comment('排序');
            $table->text('description')->nullable()->comment('描述');
            $table->boolean('is_active')->default(true)->comment('是否启用');
            $table->timestamps();
            $table->softDeletes();

            $table->index('parent_id');
            $table->index('is_active');
            $table->index('sort');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supply_categories');
    }
};
