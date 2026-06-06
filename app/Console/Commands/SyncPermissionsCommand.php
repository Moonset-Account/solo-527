<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class SyncPermissionsCommand extends Command
{
    protected $signature = 'permission:sync';
    protected $description = 'Sync all permissions and roles from PermissionSeeder';

    public function handle()
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            ['group' => '客户管理', 'name' => 'customer.view', 'display_name' => '查看客户'],
            ['group' => '客户管理', 'name' => 'customer.create', 'display_name' => '创建客户'],
            ['group' => '客户管理', 'name' => 'customer.edit', 'display_name' => '编辑客户'],
            ['group' => '客户管理', 'name' => 'customer.delete', 'display_name' => '删除客户'],
            ['group' => '客户管理', 'name' => 'customer.price_list', 'display_name' => '客户价格表'],
            ['group' => '客户管理', 'name' => 'customer.credit', 'display_name' => '客户赊账管理'],

            ['group' => '商品管理', 'name' => 'product.view', 'display_name' => '查看商品'],
            ['group' => '商品管理', 'name' => 'product.create', 'display_name' => '创建商品'],
            ['group' => '商品管理', 'name' => 'product.edit', 'display_name' => '编辑商品'],
            ['group' => '商品管理', 'name' => 'product.delete', 'display_name' => '删除商品'],
            ['group' => '商品管理', 'name' => 'product.inventory', 'display_name' => '商品库存管理'],

            ['group' => '仓位管理', 'name' => 'location.view', 'display_name' => '查看仓位'],
            ['group' => '仓位管理', 'name' => 'location.create', 'display_name' => '创建仓位'],
            ['group' => '仓位管理', 'name' => 'location.edit', 'display_name' => '编辑仓位'],
            ['group' => '仓位管理', 'name' => 'location.delete', 'display_name' => '删除仓位'],

            ['group' => '订单管理', 'name' => 'order.view', 'display_name' => '查看订单'],
            ['group' => '订单管理', 'name' => 'order.create', 'display_name' => '创建订单'],
            ['group' => '订单管理', 'name' => 'order.edit', 'display_name' => '编辑订单'],
            ['group' => '订单管理', 'name' => 'order.confirm', 'display_name' => '确认订单'],
            ['group' => '订单管理', 'name' => 'order.cancel', 'display_name' => '取消订单'],
            ['group' => '订单管理', 'name' => 'order.split', 'display_name' => '拆单处理'],

            ['group' => '拣货管理', 'name' => 'picking.view', 'display_name' => '查看拣货单'],
            ['group' => '拣货管理', 'name' => 'picking.create', 'display_name' => '创建拣货单'],
            ['group' => '拣货管理', 'name' => 'picking.execute', 'display_name' => '执行拣货'],
            ['group' => '拣货管理', 'name' => 'picking.scan', 'display_name' => '拣货扫描'],
            ['group' => '拣货管理', 'name' => 'picking.complete', 'display_name' => '完成拣货'],

            ['group' => '退货管理', 'name' => 'return.view', 'display_name' => '查看退货'],
            ['group' => '退货管理', 'name' => 'return.create', 'display_name' => '创建退货'],
            ['group' => '退货管理', 'name' => 'return.approve', 'display_name' => '审批退货'],
            ['group' => '退货管理', 'name' => 'return.receive', 'display_name' => '退货收货'],
            ['group' => '退货管理', 'name' => 'return.restock', 'display_name' => '退货入库'],

            ['group' => '欠款管理', 'name' => 'debt.view', 'display_name' => '查看欠款'],
            ['group' => '欠款管理', 'name' => 'debt.create', 'display_name' => '创建欠款'],
            ['group' => '欠款管理', 'name' => 'debt.edit', 'display_name' => '编辑欠款'],
            ['group' => '欠款管理', 'name' => 'debt.payment', 'display_name' => '欠款还款'],

            ['group' => '对账单', 'name' => 'statement.view', 'display_name' => '查看对账单'],
            ['group' => '对账单', 'name' => 'statement.create', 'display_name' => '生成对账单'],
            ['group' => '对账单', 'name' => 'statement.confirm', 'display_name' => '确认对账单'],
            ['group' => '对账单', 'name' => 'statement.send', 'display_name' => '发送对账单'],

            ['group' => '看板', 'name' => 'dashboard.view', 'display_name' => '查看看板'],
            ['group' => '看板', 'name' => 'dashboard.timeout', 'display_name' => '超时预警'],
            ['group' => '看板', 'name' => 'dashboard.resource', 'display_name' => '资源监控'],

            ['group' => '审计日志', 'name' => 'audit.view', 'display_name' => '查看审计日志'],

            ['group' => '导入导出', 'name' => 'import_export.view', 'display_name' => '查看导入导出'],
            ['group' => '导入导出', 'name' => 'import_export.create', 'display_name' => '创建导入导出任务'],
            ['group' => '导入导出', 'name' => 'import_export.import', 'display_name' => '导入数据'],
            ['group' => '导入导出', 'name' => 'import_export.export', 'display_name' => '导出数据'],
            ['group' => '导入导出', 'name' => 'import_export.download', 'display_name' => '下载文件'],

            ['group' => '系统管理', 'name' => 'system.user', 'display_name' => '用户管理'],
            ['group' => '系统管理', 'name' => 'system.role', 'display_name' => '角色权限'],
            ['group' => '系统管理', 'name' => 'system.setting', 'display_name' => '系统设置'],
        ];

        $this->info('Syncing permissions...');
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name'], 'guard_name' => 'web'],
                ['display_name' => $permission['display_name'], 'group' => $permission['group']]
            );
            $this->line("  - {$permission['name']}");
        }

        $roles = [
            [
                'name' => 'admin',
                'display_name' => '系统管理员',
                'description' => '拥有所有权限',
                'permissions' => collect($permissions)->pluck('name')->toArray(),
            ],
            [
                'name' => 'manager',
                'display_name' => '仓库经理',
                'description' => '管理仓库日常运营',
                'permissions' => [
                    'customer.view', 'customer.create', 'customer.edit',
                    'product.view', 'product.create', 'product.edit', 'product.inventory',
                    'location.view', 'location.create', 'location.edit',
                    'order.view', 'order.create', 'order.edit', 'order.confirm', 'order.cancel', 'order.split',
                    'picking.view', 'picking.create', 'picking.execute', 'picking.complete',
                    'return.view', 'return.create', 'return.approve', 'return.receive', 'return.restock',
                    'debt.view', 'debt.create', 'debt.edit', 'debt.payment',
                    'statement.view', 'statement.create', 'statement.confirm',
                    'dashboard.view', 'dashboard.timeout', 'dashboard.resource',
                    'audit.view', 'import_export.view', 'import_export.create', 'import_export.import', 'import_export.export', 'import_export.download',
                ],
            ],
            [
                'name' => 'sales',
                'display_name' => '销售员',
                'description' => '创建订单和客户管理',
                'permissions' => [
                    'customer.view', 'customer.create', 'customer.edit',
                    'product.view',
                    'order.view', 'order.create', 'order.edit',
                    'return.view', 'return.create',
                    'debt.view',
                    'statement.view',
                ],
            ],
            [
                'name' => 'picker',
                'display_name' => '拣货员',
                'description' => '执行拣货任务',
                'permissions' => [
                    'picking.view', 'picking.execute', 'picking.scan', 'picking.complete',
                    'product.view',
                    'location.view',
                ],
            ],
            [
                'name' => 'warehouse',
                'display_name' => '仓管员',
                'description' => '库存和退货管理',
                'permissions' => [
                    'product.view', 'product.inventory',
                    'location.view',
                    'picking.view',
                    'return.view', 'return.receive', 'return.restock',
                    'dashboard.view',
                ],
            ],
            [
                'name' => 'finance',
                'display_name' => '财务',
                'description' => '欠款和对账单管理',
                'permissions' => [
                    'customer.view', 'customer.credit',
                    'order.view',
                    'debt.view', 'debt.create', 'debt.edit', 'debt.payment',
                    'return.view',
                    'statement.view', 'statement.create', 'statement.confirm', 'statement.send',
                    'dashboard.view',
                    'import_export.view', 'import_export.create', 'import_export.import', 'import_export.export', 'import_export.download',
                ],
            ],
        ];

        $this->info("\nSyncing roles...");
        foreach ($roles as $roleData) {
            $role = Role::firstOrCreate(
                ['name' => $roleData['name'], 'guard_name' => 'web'],
                ['display_name' => $roleData['display_name'], 'description' => $roleData['description']]
            );
            $role->syncPermissions($roleData['permissions']);
            $this->line("  - {$roleData['name']}: " . count($roleData['permissions']) . " permissions");
        }

        $this->info("\nPermissions and roles synced successfully!");
        return Command::SUCCESS;
    }
}
