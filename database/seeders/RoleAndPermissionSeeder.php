<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $modules = [
            'dashboard',
            'greenhouses',
            'environment-data',
            'environment-alerts',
            'orders',
            'sorting-tasks',
            'sorting-discrepancies',
            'shipments',
            'subsidy-vouchers',
            'machinery-appointments',
            'saved-filters',
            'users',
            'roles',
            'audit-logs',
        ];

        $permissions = [];
        foreach ($modules as $module) {
            foreach (['view', 'create', 'edit', 'delete'] as $action) {
                $permissions[] = "{$action}-{$module}";
            }
        }

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $superAdmin = Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'web']);
        $superAdmin->syncPermissions(Permission::all());

        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $adminPermissions = collect($permissions)->filter(function ($perm) {
            return !in_array($perm, ['delete-users', 'delete-roles', 'delete-audit-logs']);
        });
        $admin->syncPermissions($adminPermissions);

        $manager = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'web']);
        $managerPermissions = collect($permissions)->filter(function ($perm) {
            [$action, $module] = explode('-', $perm, 2);
            return !in_array($module, ['users', 'roles', 'audit-logs']) && $action !== 'delete';
        });
        $manager->syncPermissions($managerPermissions);

        $operator = Role::firstOrCreate(['name' => 'operator', 'guard_name' => 'web']);
        $operatorPermissions = collect($permissions)->filter(function ($perm) {
            [$action, $module] = explode('-', $perm, 2);
            return in_array($module, ['dashboard', 'greenhouses', 'environment-data', 'sorting-tasks', 'shipments', 'saved-filters']) && in_array($action, ['view', 'create', 'edit']);
        });
        $operator->syncPermissions($operatorPermissions);

        $viewer = Role::firstOrCreate(['name' => 'viewer', 'guard_name' => 'web']);
        $viewerPermissions = collect($permissions)->filter(function ($perm) {
            [$action] = explode('-', $perm, 2);
            return $action === 'view';
        });
        $viewer->syncPermissions($viewerPermissions);
    }
}
