<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Event;
use App\Models\EventSession;
use App\Models\EventSeat;
use App\Models\TicketType;
use App\Models\SystemConfig;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'event.view',
            'event.create',
            'event.edit',
            'event.delete',

            'registration.view',
            'registration.create',
            'registration.edit',
            'registration.delete',
            'registration.approve',

            'summary.view',
            'summary.edit',

            'quality.view',
            'quality.edit',

            'config.view',
            'config.edit',
            'config.feature.toggle',
            'config.session.manage',
            'config.seat.manage',
            'config.refund.process',
            'config.feedback.view',
            'config.logs.view',

            'duplicate.view',
            'duplicate.resolve',
            'duplicate.assign',

            'export.view',
            'export.create',
            'export.download',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        $adminRole = Role::firstOrCreate([
            'name' => 'admin',
            'guard_name' => 'web',
            'display_name' => '超级管理员',
            'description' => '拥有系统所有权限',
        ]);
        $adminRole->syncPermissions(Permission::all());

        $managerRole = Role::firstOrCreate([
            'name' => 'manager',
            'guard_name' => 'web',
            'display_name' => '运营经理',
            'description' => '活动运营管理权限',
        ]);
        $managerRole->syncPermissions([
            'event.view', 'event.create', 'event.edit',
            'registration.view', 'registration.create', 'registration.edit', 'registration.approve',
            'summary.view', 'summary.edit',
            'quality.view',
            'config.view', 'config.edit', 'config.feature.toggle',
            'config.session.manage', 'config.seat.manage',
            'config.refund.process', 'config.feedback.view',
            'duplicate.view', 'duplicate.resolve', 'duplicate.assign',
            'export.view', 'export.create', 'export.download',
        ]);

        $ticketRole = Role::firstOrCreate([
            'name' => 'ticket_operator',
            'guard_name' => 'web',
            'display_name' => '票务运营',
            'description' => '报名资料录入与票务处理',
        ]);
        $ticketRole->syncPermissions([
            'event.view',
            'registration.view', 'registration.create', 'registration.edit',
            'summary.view',
            'quality.view',
            'duplicate.view',
            'export.view', 'export.create', 'export.download',
        ]);

        $financeRole = Role::firstOrCreate([
            'name' => 'finance',
            'guard_name' => 'web',
            'display_name' => '财务人员',
            'description' => '退款审核与财务数据处理',
        ]);
        $financeRole->syncPermissions([
            'event.view',
            'registration.view',
            'summary.view',
            'config.view',
            'config.refund.process',
            'export.view', 'export.create', 'export.download',
        ]);

        $analystRole = Role::firstOrCreate([
            'name' => 'analyst',
            'guard_name' => 'web',
            'display_name' => '数据分析',
            'description' => '查看报表与分析数据',
        ]);
        $analystRole->syncPermissions([
            'event.view',
            'registration.view',
            'summary.view',
            'quality.view',
            'config.feedback.view', 'config.logs.view',
            'duplicate.view',
            'export.view', 'export.download',
        ]);

        $adminUser = User::firstOrCreate(
            ['email' => 'admin@summit.local'],
            [
                'name' => '系统管理员',
                'phone' => '13800000001',
                'department' => '信息中心',
                'position' => '系统管理员',
                'employee_no' => 'EMP0001',
                'password' => Hash::make('Admin@123'),
            ]
        );
        $adminUser->assignRole('admin');

        $managerUser = User::firstOrCreate(
            ['email' => 'manager@summit.local'],
            [
                'name' => '张运营',
                'phone' => '13800000002',
                'department' => '市场部',
                'position' => '运营经理',
                'employee_no' => 'EMP0002',
                'password' => Hash::make('Manager@123'),
            ]
        );
        $managerUser->assignRole('manager');

        $ticketUser1 = User::firstOrCreate(
            ['email' => 'ticket1@summit.local'],
            [
                'name' => '李票务',
                'phone' => '13800000003',
                'department' => '票务组',
                'position' => '票务运营专员',
                'employee_no' => 'EMP0003',
                'password' => Hash::make('Ticket@123'),
            ]
        );
        $ticketUser1->assignRole('ticket_operator');

        $ticketUser2 = User::firstOrCreate(
            ['email' => 'ticket2@summit.local'],
            [
                'name' => '王报名',
                'phone' => '13800000004',
                'department' => '票务组',
                'position' => '报名录入专员',
                'employee_no' => 'EMP0004',
                'password' => Hash::make('Ticket@123'),
            ]
        );
        $ticketUser2->assignRole('ticket_operator');

        $event = Event::firstOrCreate(
            ['name' => '2026中国AI产业创新峰会'],
            [
                'theme' => 'AI赋能 · 智创未来',
                'description' => '聚焦人工智能技术创新与产业落地，汇聚行业领袖、技术专家与投资机构，共同探讨AI产业发展新趋势。',
                'location' => '上海国际会议中心',
                'address' => '上海市浦东新区滨江大道2727号',
                'start_time' => now()->addDays(30)->setTime(9, 0),
                'end_time' => now()->addDays(30)->setTime(18, 0),
                'organizer' => '中国人工智能产业联盟',
                'undertaker' => '上海智创会展有限公司',
                'expected_count' => 1500,
                'status' => 'registering',
                'created_by' => $adminUser->id,
                'tags' => ['AI', '人工智能', '产业峰会', '技术创新'],
            ]
        );

        $session1 = EventSession::firstOrCreate(
            ['event_id' => $event->id, 'name' => '主论坛·开幕致辞与主题演讲'],
            [
                'venue' => '主会场·一楼宴会厅',
                'start_time' => now()->addDays(30)->setTime(9, 0),
                'end_time' => now()->addDays(30)->setTime(12, 0),
                'speaker' => '多位院士及行业领袖',
                'agenda' => '开幕致辞｜主旨演讲：AI产业发展趋势｜圆桌对话',
                'capacity' => 1500,
                'seat_count' => 800,
                'sort_order' => 1,
                'is_active' => true,
                'created_by' => $adminUser->id,
            ]
        );

        $session2 = EventSession::firstOrCreate(
            ['event_id' => $event->id, 'name' => '分论坛A·大模型技术与应用'],
            [
                'venue' => '分会场A·三楼长江厅',
                'start_time' => now()->addDays(30)->setTime(14, 0),
                'end_time' => now()->addDays(30)->setTime(17, 30),
                'speaker' => '知名大模型团队技术负责人',
                'agenda' => '大模型技术演进｜行业落地案例｜技术实践',
                'capacity' => 400,
                'seat_count' => 300,
                'sort_order' => 2,
                'is_active' => true,
                'created_by' => $adminUser->id,
            ]
        );

        $session3 = EventSession::firstOrCreate(
            ['event_id' => $event->id, 'name' => '分论坛B·AI+产业数字化转型'],
            [
                'venue' => '分会场B·三楼黄河厅',
                'start_time' => now()->addDays(30)->setTime(14, 0),
                'end_time' => now()->addDays(30)->setTime(17, 30),
                'speaker' => '传统行业数字化转型专家',
                'agenda' => '制造｜金融｜医疗｜零售行业AI转型实践',
                'capacity' => 400,
                'seat_count' => 300,
                'sort_order' => 3,
                'is_active' => true,
                'created_by' => $adminUser->id,
            ]
        );

        $event2 = Event::firstOrCreate(
            ['name' => '2026金融科技高峰论坛'],
            [
                'theme' => '科技驱动 · 金融新生态',
                'description' => '深入探讨金融科技发展前沿，聚焦数字货币、智能风控、财富科技等热点话题。',
                'location' => '北京金融街国际会议中心',
                'address' => '北京市西城区金融街9号',
                'start_time' => now()->addDays(60)->setTime(9, 0),
                'end_time' => now()->addDays(60)->setTime(18, 0),
                'organizer' => '中国金融科技促进会',
                'expected_count' => 800,
                'status' => 'registering',
                'created_by' => $managerUser->id,
                'tags' => ['金融科技', 'FinTech', '区块链', '数字货币'],
            ]
        );

        EventSession::firstOrCreate(
            ['event_id' => $event2->id, 'name' => '金融科技主论坛'],
            [
                'venue' => '主会场',
                'start_time' => now()->addDays(60)->setTime(9, 0),
                'end_time' => now()->addDays(60)->setTime(12, 0),
                'capacity' => 800,
                'seat_count' => 600,
                'sort_order' => 1,
                'is_active' => true,
                'created_by' => $managerUser->id,
            ]
        );

        TicketType::firstOrCreate(
            ['event_id' => $event->id, 'name' => '标准通票'],
            [
                'description' => '包含所有论坛参会资格、会议资料、工作午餐及茶歇',
                'price' => 1999,
                'original_price' => 2999,
                'total_count' => 1000,
                'sold_count' => 0,
                'sale_start_time' => now(),
                'sale_end_time' => now()->addDays(29),
                'is_active' => true,
                'created_by' => $adminUser->id,
            ]
        );

        TicketType::firstOrCreate(
            ['event_id' => $event->id, 'name' => 'VIP尊享票'],
            [
                'description' => '前排VIP座位、专属休息区、VIP晚宴、嘉宾合影机会、会后报告',
                'price' => 5999,
                'original_price' => 7999,
                'total_count' => 100,
                'sold_count' => 0,
                'sale_start_time' => now(),
                'sale_end_time' => now()->addDays(29),
                'is_active' => true,
                'created_by' => $adminUser->id,
            ]
        );

        TicketType::firstOrCreate(
            ['event_id' => $event->id, 'name' => '嘉宾邀请票'],
            [
                'description' => '定向邀请嘉宾专属',
                'price' => 0,
                'original_price' => 0,
                'total_count' => 200,
                'sold_count' => 0,
                'is_active' => true,
                'created_by' => $adminUser->id,
            ]
        );

        $defaultConfigs = [
            ['feature_toggle', 'enable_online_registration', true, '开启线上报名', 'boolean'],
            ['feature_toggle', 'enable_payment', false, '开启在线支付', 'boolean'],
            ['feature_toggle', 'enable_auto_check_in', false, '开启自动签到', 'boolean'],
            ['feature_toggle', 'enable_auto_score', true, '开启自动质量评分', 'boolean'],
            ['feature_toggle', 'enable_duplicate_detection', true, '开启重复检测', 'boolean'],
            ['feature_toggle', 'enable_notification', true, '开启消息通知', 'boolean'],
            ['feature_toggle', 'show_attendance_stats', true, '显示到场统计', 'boolean'],
            ['feature_toggle', 'allow_self_feedback', false, '允许自助提交反馈', 'boolean'],

            ['registration', 'min_quality_threshold', 40, '报名质量最低阈值', 'integer'],
            ['registration', 'auto_approve_score', 80, '自动通过质量分数', 'integer'],
            ['registration', 'duplicate_phone_check', true, '手机号重复检测', 'boolean'],
            ['registration', 'duplicate_company_person_check', true, '公司人员重复检测', 'boolean'],

            ['attendance', 'no_show_threshold_hour', 1, '爽约判定阈值(小时)', 'integer'],
            ['attendance', 'enable_auto_no_show', true, '自动标记爽约', 'boolean'],

            ['refund', 'allow_refund_before_days', 7, '活动前X天可申请退款', 'integer'],
            ['refund', 'refund_fee_rate', 0.10, '退款手续费率', 'number'],
            ['refund', 'require_manager_approve_threshold', 5000, '经理审批金额阈值', 'integer'],

            ['export', 'file_expire_days', 30, '导出文件保留天数', 'integer'],
            ['export', 'max_records_per_export', 50000, '单次导出最大记录数', 'integer'],

            ['system', 'ticket_operator_same_event_only', false, '票务仅可查看自己负责的活动', 'boolean'],
        ];

        foreach ($defaultConfigs as $cfg) {
            SystemConfig::setValue($cfg[0], $cfg[1], $cfg[2], $cfg[3], $cfg[4], null, $adminUser->id);
            SystemConfig::setValue($cfg[0], $cfg[1], $cfg[2], $cfg[3], $cfg[4], $event->id, $adminUser->id);
            SystemConfig::setValue($cfg[0], $cfg[1], $cfg[2], $cfg[3], $cfg[4], $event2->id, $adminUser->id);
        }

        $zones = ['A', 'B', 'C'];
        $levels = ['normal', 'vip', 'vvip'];
        foreach ([$session1, $session2, $session3] as $session) {
            foreach ($zones as $zoneIdx => $zone) {
                $level = $levels[$zoneIdx];
                $price = $level === 'vvip' ? 5999 : ($level === 'vip' ? 2999 : 1999);
                for ($row = 1; $row <= 5; $row++) {
                    for ($seat = 1; $seat <= 10; $seat++) {
                        EventSeat::firstOrCreate(
                            [
                                'event_id' => $event->id,
                                'session_id' => $session->id,
                                'zone' => $zone,
                                'row' => (string) $row,
                                'seat_no' => (string) $seat,
                            ],
                            [
                                'price' => $price,
                                'level' => $level,
                                'status' => 'available',
                                'created_by' => $adminUser->id,
                            ]
                        );
                    }
                }
            }
        }
    }
}
