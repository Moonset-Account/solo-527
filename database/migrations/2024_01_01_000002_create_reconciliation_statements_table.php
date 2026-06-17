<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reconciliation_statements', function (Blueprint $table) {
            $table->id();
            $table->string('period')->comment('期别');
            $table->date('upload_date')->comment('上传日期');
            $table->string('status')->default('pending')->comment('状态');
            $table->string('uploaded_by')->comment('上传人');
            $table->string('file_path')->nullable()->comment('文件路径');
            $table->text('remarks')->nullable()->comment('备注');
            $table->softDeletes();
            $table->timestamps();

            $table->index('period');
            $table->index('upload_date');
            $table->index('status');
            $table->index('uploaded_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reconciliation_statements');
    }
};
