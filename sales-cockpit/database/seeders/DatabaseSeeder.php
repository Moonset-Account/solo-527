<?php

namespace Database\Seeders;

use App\Models\Indicator;
use App\Models\IndicatorValue;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::create(['name' => 'admin', 'description' => '系统管理员']);
        $directorRole = Role::create(['name' => 'sales_director', 'description' => '销售总监']);
        $analystRole = Role::create(['name' => 'business_analyst', 'description' => '业务分析师']);

        $permissions = [
            ['name' => 'dashboard.view', 'description' => '查看驾驶舱'],
            ['name' => 'indicator.view', 'description' => '查看指标'],
            ['name' => 'indicator.create', 'description' => '创建指标'],
            ['name' => 'indicator.update', 'description' => '更新指标'],
            ['name' => 'consistency_check.view', 'description' => '查看一致性校验'],
            ['name' => 'consistency_check.create', 'description' => '执行一致性校验'],
            ['name' => 'business_order.view', 'description' => '查看业务工单'],
            ['name' => 'business_order.create', 'description' => '创建业务工单'],
            ['name' => 'business_order.handle', 'description' => '受理业务工单'],
            ['name' => 'business_order.close', 'description' => '关闭业务工单'],
            ['name' => 'alert_rule.create', 'description' => '创建告警规则'],
            ['name' => 'alert_rule.update', 'description' => '更新告警规则'],
            ['name' => 'alert_rule.delete', 'description' => '删除告警规则'],
            ['name' => 'alert_rule.deactivate', 'description' => '停用/启用告警规则'],
            ['name' => 'dimension.create', 'description' => '创建维度配置'],
            ['name' => 'dimension.update', 'description' => '更新维度配置'],
            ['name' => 'dimension.delete', 'description' => '删除维度配置'],
            ['name' => 'dimension.deactivate', 'description' => '停用/启用维度配置'],
            ['name' => 'dataset_permission.create', 'description' => '创建数据集权限'],
            ['name' => 'dataset_permission.update', 'description' => '更新数据集权限'],
            ['name' => 'dataset_permission.deactivate', 'description' => '停用数据集权限'],
            ['name' => 'review_rhythm.view', 'description' => '查看复盘节奏'],
            ['name' => 'review_rhythm.create', 'description' => '创建复盘节奏'],
            ['name' => 'review_rhythm.update', 'description' => '更新复盘节奏'],
            ['name' => 'review_rhythm.report', 'description' => '生成月度复盘报表'],
            ['name' => 'review_rhythm.deactivate', 'description' => '停用/启用复盘节奏'],
            ['name' => 'audit_log.view', 'description' => '查看操作留痕'],
        ];

        foreach ($permissions as $perm) {
            Permission::create($perm);
        }

        $adminRole->permissions()->attach(Permission::pluck('id'));
        $directorRole->permissions()->attach(Permission::pluck('id'));
        $analystRole->permissions()->attach(
            Permission::whereIn('name', [
                'dashboard.view',
                'indicator.view',
                'consistency_check.view',
                'consistency_check.create',
                'business_order.view',
                'alert_rule.create',
                'alert_rule.update',
                'alert_rule.deactivate',
                'dimension.create',
                'dimension.update',
                'dimension.deactivate',
                'dataset_permission.create',
                'dataset_permission.update',
                'dataset_permission.deactivate',
                'review_rhythm.view',
                'review_rhythm.report',
                'review_rhythm.deactivate',
                'audit_log.view',
            ])->pluck('id')
        );

        $director = User::create([
            'name' => '销售总监',
            'email' => 'director@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $director->roles()->attach($directorRole);

        $analyst = User::create([
            'name' => '业务分析师',
            'email' => 'analyst@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $analyst->roles()->attach($analystRole);

        $admin = User::create([
            'name' => '系统管理员',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $admin->roles()->attach($adminRole);

        $indicators = [
            ['name' => '合同金额', 'code' => 'CONTRACT_AMT', 'caliber_description' => '当月已签署正式合同的总金额（含税），不含框架协议', 'unit' => '万元', 'category' => '营收', 'status' => 'active'],
            ['name' => '回款金额', 'code' => 'PAYMENT_AMT', 'caliber_description' => '当月实际到账回款金额，含预收款核销部分', 'unit' => '万元', 'category' => '营收', 'status' => 'active'],
            ['name' => '新增商机数', 'code' => 'NEW_OPP_COUNT', 'caliber_description' => '当月新录入CRM且通过审核的商机数量', 'unit' => '个', 'category' => '商机', 'status' => 'active'],
            ['name' => '商机转化率', 'code' => 'OPP_CONV_RATE', 'caliber_description' => '当月赢单商机数/当月已决策商机数×100%', 'unit' => '%', 'category' => '商机', 'status' => 'active'],
            ['name' => '客户流失率', 'code' => 'CHURN_RATE', 'caliber_description' => '当月流失客户数/月初活跃客户数×100%，流失定义为连续90天无交互', 'unit' => '%', 'category' => '客户', 'status' => 'active'],
            ['name' => '客单价', 'code' => 'AVG_ORDER_VALUE', 'caliber_description' => '当月合同金额/当月签约客户数', 'unit' => '万元', 'category' => '营收', 'status' => 'active'],
            ['name' => '销售费用率', 'code' => 'SALES_COST_RATE', 'caliber_description' => '销售费用/合同金额×100%，含差旅、招待、佣金', 'unit' => '%', 'category' => '成本', 'status' => 'active'],
            ['name' => '人效', 'code' => 'PER_CAPITA_REV', 'caliber_description' => '当月回款金额/在岗销售人数', 'unit' => '万元/人', 'category' => '效率', 'status' => 'active'],
        ];

        foreach ($indicators as $ind) {
            $ind['created_by'] = $admin->id;
            $ind['updated_by'] = $admin->id;
            $indicator = Indicator::create($ind);

            for ($i = 30; $i >= 0; $i--) {
                $date = now()->subDays($i)->toDateString();
                IndicatorValue::create([
                    'indicator_id' => $indicator->id,
                    'dimension_value' => '全国',
                    'time_period' => $date,
                    'value' => mt_rand(100, 9999) / 100,
                    'source' => 'CRM',
                    'created_by' => $analyst->id,
                ]);
            }
        }
    }
}
