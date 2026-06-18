<?php

namespace Database\Seeders;

use App\Enums\ConfigKey;
use App\Enums\PermissionName;
use App\Enums\RoleName;
use App\Models\SystemConfig;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleAndPermissionSeeder::class,
            SystemConfigSeeder::class,
            SupplyCategorySeeder::class,
        ]);

        $superAdmin = User::factory()->create([
            'name' => '超级管理员',
            'email' => 'superadmin@example.com',
            'employee_id' => 'SA001',
            'department' => 'IT部',
            'position' => '系统管理员',
        ]);
        $superAdmin->assignRole(RoleName::SUPER_ADMIN->value);

        $admin = User::factory()->create([
            'name' => '系统管理员',
            'email' => 'admin@example.com',
            'employee_id' => 'AD001',
            'department' => 'IT部',
            'position' => '管理员',
        ]);
        $admin->assignRole(RoleName::ADMIN->value);

        $procurementManager = User::factory()->create([
            'name' => '采购经理',
            'email' => 'procurement@example.com',
            'employee_id' => 'PM001',
            'department' => '采购部',
            'position' => '采购经理',
        ]);
        $procurementManager->assignRole(RoleName::PROCUREMENT_MANAGER->value);

        $procurementStaff = User::factory()->create([
            'name' => '采购员',
            'email' => 'procurement.staff@example.com',
            'employee_id' => 'PS001',
            'department' => '采购部',
            'position' => '采购员',
        ]);
        $procurementStaff->assignRole(RoleName::PROCUREMENT_STAFF->value);

        $financeManager = User::factory()->create([
            'name' => '财务经理',
            'email' => 'finance@example.com',
            'employee_id' => 'FM001',
            'department' => '财务部',
            'position' => '财务经理',
        ]);
        $financeManager->assignRole(RoleName::FINANCIAL_MANAGER->value);

        $financeStaff = User::factory()->create([
            'name' => '财务复核',
            'email' => 'finance.staff@example.com',
            'employee_id' => 'FS001',
            'department' => '财务部',
            'position' => '财务复核员',
        ]);
        $financeStaff->assignRole(RoleName::FINANCIAL_STAFF->value);

        $warehouseManager = User::factory()->create([
            'name' => '仓库经理',
            'email' => 'warehouse@example.com',
            'employee_id' => 'WM001',
            'department' => '仓储部',
            'position' => '仓库经理',
        ]);
        $warehouseManager->assignRole(RoleName::WAREHOUSE_MANAGER->value);

        $warehouseStaff = User::factory()->create([
            'name' => '仓管员',
            'email' => 'warehouse.staff@example.com',
            'employee_id' => 'WS001',
            'department' => '仓储部',
            'position' => '仓管员',
        ]);
        $warehouseStaff->assignRole(RoleName::WAREHOUSE_STAFF->value);
    }
}
