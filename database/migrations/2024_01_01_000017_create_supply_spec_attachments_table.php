<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supply_spec_attachments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('supply_id')->comment('耗材ID');
            $table->string('file_name')->comment('文件名');
            $table->string('original_name')->comment('原始文件名');
            $table->string('file_path')->comment('文件路径');
            $table->string('file_url')->nullable()->comment('文件URL');
            $table->string('file_type')->nullable()->comment('文件类型: pdf, doc, xls, image, other');
            $table->string('mime_type')->nullable()->comment('MIME类型');
            $table->unsignedBigInteger('file_size')->nullable()->comment('文件大小(字节)');
            $table->string('attachment_type')->nullable()->comment('附件类型: spec, certificate, datasheet, manual, other');
            $table->text('description')->nullable()->comment('描述');
            $table->integer('sort')->default(0)->comment('排序');
            $table->unsignedBigInteger('created_by')->nullable()->comment('创建人');
            $table->unsignedBigInteger('updated_by')->nullable()->comment('更新人');
            $table->timestamps();
            $table->softDeletes();

            $table->index('supply_id');
            $table->index('attachment_type');
            $table->foreign('supply_id')->references('id')->on('supplies')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supply_spec_attachments');
    }
};
