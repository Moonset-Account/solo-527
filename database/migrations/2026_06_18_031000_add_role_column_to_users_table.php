<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['engineer', 'admin', 'manager'])->default('engineer')->after('email');
            $table->string('phone')->nullable()->after('role');
            $table->string('department')->nullable()->after('phone');
            $table->string('position')->nullable()->after('department');
            $table->boolean('is_on_duty')->default(false)->after('position');
            $table->timestamp('last_active_at')->nullable()->after('is_on_duty');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'role',
                'phone',
                'department',
                'position',
                'is_on_duty',
                'last_active_at',
            ]);
        });
    }
};
