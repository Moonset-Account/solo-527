<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collection_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->comment('关联项目');
            $table->dateTime('collection_time')->comment('催收时间');
            $table->string('method')->comment('催收方式');
            $table->string('contact_person')->comment('联系人');
            $table->string('contact_phone')->nullable()->comment('联系电话');
            $table->text('result')->comment('催收结果');
            $table->date('next_follow_up')->nullable()->comment('下次跟进时间');
            $table->string('collected_by')->comment('催收人');
            $table->text('remarks')->nullable()->comment('备注');
            $table->softDeletes();
            $table->timestamps();

            $table->index('project_id');
            $table->index('collection_time');
            $table->index('method');
            $table->index('collected_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('collection_records');
    }
};
