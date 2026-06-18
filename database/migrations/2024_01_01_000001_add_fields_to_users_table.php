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
            $table->string('avatar')->nullable()->comment('头像');
            $table->unsignedBigInteger('manager_id')->nullable()->comment('上级ID');
            $table->unsignedBigInteger('supplier_id')->nullable()->comment('关联供应商ID');
            $table->boolean('is_active')->default(true)->comment('是否启用');
            $table->softDeletes();

            $table->index('department');
            $table->index('manager_id');
            $table->index('supplier_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropIndex(['department']);
            $table->dropIndex(['manager_id']);
            $table->dropIndex(['supplier_id']);
            $table->dropColumn([
                'employee_no',
                'phone',
                'department',
                'position',
                'avatar',
                'manager_id',
                'supplier_id',
                'is_active',
            ]);
        });
    }
};
