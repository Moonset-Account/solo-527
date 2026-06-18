<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('employee_no')->nullable()->unique()->comment('工号');
            $table->string('phone')->nullable()->comment('手机号');
            $table->string('department')->nullable()->comment('部门');
            $table->string('position')->nullable()->comment('职位');
            $table->unsignedBigInteger('manager_id')->nullable()->comment('上级ID');
            $table->boolean('is_active')->default(true)->comment('是否启用');
            $table->softDeletes();

            $table->index('department');
            $table->index('manager_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropIndex(['department']);
            $table->dropIndex(['manager_id']);
            $table->dropColumn([
                'employee_no',
                'phone',
                'department',
                'position',
                'manager_id',
                'is_active',
            ]);
        });
    }
};
