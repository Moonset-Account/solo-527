<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['name' => 'operate:upload', 'guard_name' => 'web'],
            ['name' => 'operate:confirm-difference', 'guard_name' => 'web'],
            ['name' => 'admin:assign-difference', 'guard_name' => 'web'],
            ['name' => 'admin:manage-writeoff', 'guard_name' => 'web'],
            ['name' => 'report:view', 'guard_name' => 'web'],
            ['name' => 'report:export', 'guard_name' => 'web'],
            ['name' => 'dashboard:view', 'guard_name' => 'web'],
            ['name' => 'dashboard:review', 'guard_name' => 'web'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate($permission);
        }
    }
}
