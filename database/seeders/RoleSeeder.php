<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $projectManager = Role::firstOrCreate(['name' => 'project_manager', 'guard_name' => 'web']);
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

        $projectManagerPermissions = [
            'operate:upload',
            'operate:confirm-difference',
            'report:view',
            'report:export',
            'dashboard:view',
        ];

        $adminPermissions = [
            'operate:upload',
            'operate:confirm-difference',
            'admin:assign-difference',
            'admin:manage-writeoff',
            'report:view',
            'report:export',
            'dashboard:view',
            'dashboard:review',
        ];

        $projectManager->syncPermissions($projectManagerPermissions);
        $admin->syncPermissions($adminPermissions);
    }
}
