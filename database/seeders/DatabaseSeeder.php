<?php

namespace Database\Seeders;

use App\Models\EscalationRule;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::create([
            'name' => '系统管理员',
            'email' => 'admin@example.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'phone' => '13800138000',
            'department' => 'IT部门',
            'is_on_duty' => true,
            'email_verified_at' => now(),
        ]);

        $manager = User::create([
            'name' => '值班经理',
            'email' => 'manager@example.com',
            'password' => Hash::make('manager123'),
            'role' => 'manager',
            'phone' => '13800138001',
            'department' => '运维部门',
            'is_on_duty' => true,
            'email_verified_at' => now(),
        ]);

        $engineer1 = User::create([
            'name' => '张工程师',
            'email' => 'engineer1@example.com',
            'password' => Hash::make('engineer123'),
            'role' => 'engineer',
            'phone' => '13800138002',
            'department' => '运维部门',
            'is_on_duty' => true,
            'email_verified_at' => now(),
        ]);

        $engineer2 = User::create([
            'name' => '李工程师',
            'email' => 'engineer2@example.com',
            'password' => Hash::make('engineer123'),
            'role' => 'engineer',
            'phone' => '13800138003',
            'department' => '运维部门',
            'is_on_duty' => false,
            'email_verified_at' => now(),
        ]);

        EscalationRule::create([
            'name' => '严重告警15分钟升级',
            'description' => '严重告警超过15分钟未处理自动升级',
            'level' => 'critical',
            'wait_minutes' => 15,
            'escalation_level' => 2,
            'notification_channels' => json_encode(['site', 'email', 'sms']),
            'notify_roles' => json_encode(['admin', 'manager']),
            'notify_user_ids' => json_encode([$manager->id, $admin->id]),
            'is_enabled' => true,
        ]);

        EscalationRule::create([
            'name' => '警告告警30分钟升级',
            'description' => '警告告警超过30分钟未处理自动升级',
            'level' => 'warning',
            'wait_minutes' => 30,
            'escalation_level' => 1,
            'notification_channels' => json_encode(['site', 'email']),
            'notify_roles' => json_encode(['manager']),
            'notify_user_ids' => json_encode([$manager->id]),
            'is_enabled' => true,
        ]);

        EscalationRule::create([
            'name' => '信息告警60分钟升级',
            'description' => '信息告警超过60分钟未处理自动升级',
            'level' => 'info',
            'wait_minutes' => 60,
            'escalation_level' => 1,
            'notification_channels' => json_encode(['site']),
            'notify_roles' => json_encode([]),
            'notify_user_ids' => json_encode([]),
            'is_enabled' => true,
        ]);

        $this->command->info('✓ 测试账号已创建:');
        $this->command->info('  管理员: admin@example.com / admin123');
        $this->command->info('  值班经理: manager@example.com / manager123');
        $this->command->info('  工程师1: engineer1@example.com / engineer123');
        $this->command->info('  工程师2: engineer2@example.com / engineer123');
    }
}
