<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checklist_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('checklist_id')->constrained();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('draft'); // draft, submitted, reviewed, closed
            $table->foreignId('submitted_by')->nullable()->constrained('users');
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->foreignId('responsible_user_id')->nullable()->constrained('users'); // 责任人
            $table->string('department')->nullable();
            $table->date('check_date')->nullable();
            $table->date('due_date')->nullable(); // 整改期限
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['status', 'created_at']);
            $table->index(['responsible_user_id', 'status']);
            $table->index(['due_date', 'status']);
        });

        Schema::create('checklist_record_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('checklist_record_id')->constrained()->onDelete('cascade');
            $table->foreignId('checklist_item_id')->constrained();
            $table->string('result')->default('pending'); // pass, fail, partial, pending, na
            $table->text('evidence')->nullable();
            $table->text('remark')->nullable();
            $table->boolean('has_gap')->default(false);
            $table->timestamps();
            $table->index(['checklist_record_id', 'result']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checklist_record_items');
        Schema::dropIfExists('checklist_records');
    }
};
