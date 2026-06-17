<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('write_offs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reconciliation_difference_id')->constrained()->comment('关联差异记录');
            $table->decimal('amount', 15, 2)->comment('冲销金额');
            $table->text('reason')->comment('冲销原因');
            $table->string('approval_status')->default('pending')->comment('审批状态');
            $table->string('approved_by')->nullable()->comment('审批人');
            $table->date('approved_at')->nullable()->comment('审批时间');
            $table->text('approval_remarks')->nullable()->comment('审批备注');
            $table->softDeletes();
            $table->timestamps();

            $table->index('reconciliation_difference_id');
            $table->index('approval_status');
            $table->index('approved_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('write_offs');
    }
};
