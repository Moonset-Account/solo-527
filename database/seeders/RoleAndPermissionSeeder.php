<?php

namespace Database\Seeders;

use App\Enums\PermissionName;
use App\Enums\RoleName;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            PermissionName::VIEW_SUPPLIES->value,
            PermissionName::CREATE_SUPPLIES->value,
            PermissionName::EDIT_SUPPLIES->value,
            PermissionName::DELETE_SUPPLIES->value,
            PermissionName::VIEW_SUPPLIERS->value,
            PermissionName::CREATE_SUPPLIERS->value,
            PermissionName::EDIT_SUPPLIERS->value,
            PermissionName::DELETE_SUPPLIERS->value,
            PermissionName::ASSESS_SUPPLIER_RISK->value,
            PermissionName::VIEW_PURCHASE_REQUESTS->value,
            PermissionName::CREATE_PURCHASE_REQUESTS->value,
            PermissionName::EDIT_PURCHASE_REQUESTS->value,
            PermissionName::APPROVE_PURCHASE_REQUESTS->value,
            PermissionName::VIEW_QUOTATIONS->value,
            PermissionName::CREATE_QUOTATIONS->value,
            PermissionName::REVIEW_QUOTATIONS->value,
            PermissionName::MANAGE_APPROVAL_FLOWS->value,
            PermissionName::MANAGE_DELIVERIES->value,
            PermissionName::VIEW_DELIVERY_DISCREPANCIES->value,
            PermissionName::MANAGE_SYSTEM_CONFIG->value,
            PermissionName::VIEW_ACTIVITY_LOG->value,
            PermissionName::VIEW_FAILED_BATCHES->value,
            PermissionName::RETRY_FAILED_BATCHES->value,
            PermissionName::MANAGE_USERS->value,
            PermissionName::MANAGE_ROLES->value,
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $rolePermissions = [
            RoleName::SUPER_ADMIN->value => $permissions,
            RoleName::ADMIN->value => [
                PermissionName::VIEW_SUPPLIES->value,
                PermissionName::CREATE_SUPPLIES->value,
                PermissionName::EDIT_SUPPLIES->value,
                PermissionName::DELETE_SUPPLIES->value,
                PermissionName::VIEW_SUPPLIERS->value,
                PermissionName::CREATE_SUPPLIERS->value,
                PermissionName::EDIT_SUPPLIERS->value,
                PermissionName::ASSESS_SUPPLIER_RISK->value,
                PermissionName::VIEW_PURCHASE_REQUESTS->value,
                PermissionName::VIEW_QUOTATIONS->value,
                PermissionName::MANAGE_APPROVAL_FLOWS->value,
                PermissionName::MANAGE_SYSTEM_CONFIG->value,
                PermissionName::VIEW_ACTIVITY_LOG->value,
                PermissionName::VIEW_FAILED_BATCHES->value,
                PermissionName::RETRY_FAILED_BATCHES->value,
                PermissionName::MANAGE_USERS->value,
            ],
            RoleName::PROCUREMENT_MANAGER->value => [
                PermissionName::VIEW_SUPPLIES->value,
                PermissionName::CREATE_SUPPLIES->value,
                PermissionName::EDIT_SUPPLIES->value,
                PermissionName::VIEW_SUPPLIERS->value,
                PermissionName::CREATE_SUPPLIERS->value,
                PermissionName::EDIT_SUPPLIERS->value,
                PermissionName::ASSESS_SUPPLIER_RISK->value,
                PermissionName::VIEW_PURCHASE_REQUESTS->value,
                PermissionName::CREATE_PURCHASE_REQUESTS->value,
                PermissionName::EDIT_PURCHASE_REQUESTS->value,
                PermissionName::APPROVE_PURCHASE_REQUESTS->value,
                PermissionName::VIEW_QUOTATIONS->value,
                PermissionName::CREATE_QUOTATIONS->value,
                PermissionName::MANAGE_DELIVERIES->value,
            ],
            RoleName::PROCUREMENT_STAFF->value => [
                PermissionName::VIEW_SUPPLIES->value,
                PermissionName::CREATE_SUPPLIES->value,
                PermissionName::EDIT_SUPPLIES->value,
                PermissionName::VIEW_SUPPLIERS->value,
                PermissionName::VIEW_PURCHASE_REQUESTS->value,
                PermissionName::CREATE_PURCHASE_REQUESTS->value,
                PermissionName::EDIT_PURCHASE_REQUESTS->value,
                PermissionName::VIEW_QUOTATIONS->value,
                PermissionName::CREATE_QUOTATIONS->value,
            ],
            RoleName::FINANCIAL_MANAGER->value => [
                PermissionName::VIEW_PURCHASE_REQUESTS->value,
                PermissionName::APPROVE_PURCHASE_REQUESTS->value,
                PermissionName::VIEW_QUOTATIONS->value,
                PermissionName::REVIEW_QUOTATIONS->value,
                PermissionName::VIEW_DELIVERY_DISCREPANCIES->value,
            ],
            RoleName::FINANCIAL_STAFF->value => [
                PermissionName::VIEW_QUOTATIONS->value,
                PermissionName::REVIEW_QUOTATIONS->value,
                PermissionName::VIEW_DELIVERY_DISCREPANCIES->value,
            ],
            RoleName::WAREHOUSE_MANAGER->value => [
                PermissionName::VIEW_SUPPLIES->value,
                PermissionName::VIEW_PURCHASE_REQUESTS->value,
                PermissionName::MANAGE_DELIVERIES->value,
            ],
            RoleName::WAREHOUSE_STAFF->value => [
                PermissionName::VIEW_SUPPLIES->value,
                PermissionName::VIEW_PURCHASE_REQUESTS->value,
                PermissionName::MANAGE_DELIVERIES->value,
            ],
        ];

        foreach ($rolePermissions as $roleName => $perms) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($perms);
        }
    }
}
