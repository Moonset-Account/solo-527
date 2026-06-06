<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'manage products',
            'manage ingredients',
            'manage inventory',
            'manage orders',
            'manage production',
            'manage pickup slots',
            'manage payments',
            'manage refunds',
            'manage users',
            'manage roles',
            'view dashboard',
            'view production board',
            'process pickups',
            'export reports',
            'import data',
            'view own orders',
            'create orders',
            'cancel own orders',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->syncPermissions($permissions);

        $staffPermissions = [
            'manage products',
            'manage ingredients',
            'manage inventory',
            'manage orders',
            'manage production',
            'manage pickup slots',
            'manage payments',
            'manage refunds',
            'view dashboard',
            'view production board',
            'process pickups',
            'export reports',
            'import data',
        ];
        $staffRole = Role::firstOrCreate(['name' => 'staff']);
        $staffRole->syncPermissions($staffPermissions);

        $customerPermissions = [
            'view own orders',
            'create orders',
            'cancel own orders',
        ];
        $customerRole = Role::firstOrCreate(['name' => 'customer']);
        $customerRole->syncPermissions($customerPermissions);
    }
}
