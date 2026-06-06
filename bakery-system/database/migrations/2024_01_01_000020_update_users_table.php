<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone')->nullable()->unique()->after('email');
            }
            if (!Schema::hasColumn('users', 'user_type')) {
                $table->enum('user_type', ['admin', 'staff', 'customer'])->default('customer')->after('phone');
            }
            if (!Schema::hasColumn('users', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('user_type');
            }
            if (!Schema::hasColumn('users', 'deleted_at')) {
                $table->softDeletes()->after('remember_token');
            }
        });
    }

    public function down(): void
    {
        //
    }
};
