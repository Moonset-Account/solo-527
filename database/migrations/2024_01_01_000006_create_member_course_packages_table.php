<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_course_packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained()->onDelete('cascade');
            $table->foreignId('course_type_id')->constrained()->onDelete('cascade');
            $table->foreignId('coach_id')->nullable()->constrained('coaches')->onDelete('set null');
            $table->string('package_name')->nullable();
            $table->integer('total_lessons');
            $table->integer('used_lessons')->default(0);
            $table->integer('remaining_lessons');
            $table->decimal('unit_price', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->decimal('purchase_price', 10, 2)->default(0);
            $table->date('purchase_date')->nullable();
            $table->date('expire_date')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_course_packages');
    }
};
