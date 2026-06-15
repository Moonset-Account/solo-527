<?php

namespace Database\Seeders;

use App\Models\Checklist;
use App\Models\ChecklistItem;
use App\Models\ChecklistRecord;
use App\Models\ChecklistRecordItem;
use App\Models\ComplianceGap;
use App\Models\DownloadLog;
use App\Models\GapEvidence;
use App\Models\GapHandlingLog;
use App\Models\ReminderLog;
use App\Models\ReminderRule;
use App\Models\SavedFilter;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. 创建3个角色用户
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => '系统管理员',
                'password' => Hash::make('password123'),
                'role' => User::ROLE_ADMIN,
                'department' => '信息技术部',
            ]
        );

        $complianceMgr = User::firstOrCreate(
            ['email' => 'compliance@example.com'],
            [
                'name' => '李明（合规经理）',
                'password' => Hash::make('password123'),
                'role' => User::ROLE_COMPLIANCE_MANAGER,
                'department' => '合规管理部',
            ]
        );

        $secretary = User::firstOrCreate(
            ['email' => 'secretary@example.com'],
            [
                'name' => '王芳（项目秘书）',
                'password' => Hash::make('password123'),
                'role' => User::ROLE_PROJECT_SECRETARY,
                'department' => '项目管理办公室',
            ]
        );

        $users = collect([$admin, $complianceMgr, $secretary]);

        // 2. 创建检查清单模板1: 数据安全合规
        $checklist1 = Checklist::create([
            'title' => '数据安全合规检查清单（季度）',
            'description' => '用于每季度各业务系统的数据安全合规现场检查，覆盖加密、备份、访问控制等维度',
            'category' => '数据安全',
            'version' => '1.2',
            'is_active' => true,
            'created_by' => $complianceMgr->id,
        ]);

        $items1 = [
            ['title' => '敏感数据传输是否启用TLS加密', 'description' => '检查业务系统内部和对外接口', 'criteria' => '所有HTTPS接口TLS版本 >= 1.2；内网敏感传输需加密', 'risk_level' => 'high', 'category' => '传输安全', 'is_required' => true],
            ['title' => '数据库敏感字段是否加密存储', 'description' => '身份证、手机号、银行卡、密码等', 'criteria' => '至少AES-256或国密SM4加密；不得明文存储密码', 'risk_level' => 'high', 'category' => '存储安全', 'is_required' => true],
            ['title' => '是否定期进行数据备份与恢复测试', 'description' => '备份策略、恢复演练记录', 'criteria' => '每日增量+每周全量备份；每季度至少一次恢复演练', 'risk_level' => 'medium', 'category' => '备份恢复', 'is_required' => true],
            ['title' => '用户访问权限是否遵循最小权限原则', 'description' => '账号权限分配与定期复核', 'criteria' => '权限申请流程留痕；超管账号双人共管；每半年权限审计', 'risk_level' => 'high', 'category' => '访问控制', 'is_required' => true],
            ['title' => '是否存在离职账号未及时停用的情况', 'description' => 'HR离职流程与IT账号联动', 'criteria' => '离职当日100%停用；抽查10个离职样本全部合格', 'risk_level' => 'medium', 'category' => '账号管理', 'is_required' => true],
            ['title' => '是否启用操作审计日志并留存6个月以上', 'description' => '系统日志、数据库审计', 'criteria' => '日志内容包含操作人/时间/对象/结果；存储≥6个月', 'risk_level' => 'medium', 'category' => '审计日志', 'is_required' => true],
            ['title' => '数据跨境传输是否经过合规评估', 'description' => '跨境数据流动评估', 'criteria' => '存在出境场景需完成安全评估并留存文档', 'risk_level' => 'high', 'category' => '数据出境', 'is_required' => false],
            ['title' => '个人信息处理是否履行告知同意义务', 'description' => '隐私政策弹窗与同意记录', 'criteria' => '隐私政策显著位置展示；敏感操作二次单独同意', 'risk_level' => 'medium', 'category' => '个人信息', 'is_required' => true],
        ];
        foreach ($items1 as $i => $item) {
            $checklist1->items()->create(array_merge($item, ['sort_order' => $i + 1]));
        }

        // 清单2: 网络与运维安全
        $checklist2 = Checklist::create([
            'title' => '网络与运维安全检查（月度）',
            'description' => '月度安全巡检，含补丁、防火墙、弱口令、基线配置',
            'category' => '网络安全',
            'version' => '1.0',
            'is_active' => true,
            'created_by' => $admin->id,
        ]);
        $items2 = [
            ['title' => '操作系统安全补丁是否在30天内安装', 'description' => '高危漏洞补丁', 'criteria' => '高危漏洞7天内修复；其他30天内', 'risk_level' => 'high', 'category' => '漏洞管理', 'is_required' => true],
            ['title' => '弱口令/默认口令是否已整改', 'description' => '密码强度与复杂度', 'criteria' => '无默认口令admin/123456；密码长度≥8位含多种字符', 'risk_level' => 'high', 'category' => '身份认证', 'is_required' => true],
            ['title' => '防火墙策略是否最小化并定期审计', 'description' => 'ACL策略', 'criteria' => '无0.0.0.0/0 全开放端口；每季度策略审计', 'risk_level' => 'high', 'category' => '边界防护', 'is_required' => true],
            ['title' => '服务器基线配置是否达标', 'description' => '安全基线', 'criteria' => '等保2.0三级基线合格率≥95%', 'risk_level' => 'medium', 'category' => '基线配置', 'is_required' => true],
            ['title' => '重要系统是否启用双因素认证', 'description' => 'VPN、堡垒机、运维平台', 'criteria' => '运维入口100%启用MFA', 'risk_level' => 'high', 'category' => '身份认证', 'is_required' => true],
        ];
        foreach ($items2 as $i => $item) {
            $checklist2->items()->create(array_merge($item, ['sort_order' => $i + 1]));
        }

        // 3. 创建检查记录 + 关联的缺口
        $this->seedChecklistRecord(
            $checklist1, $complianceMgr, $secretary,
            '2026年Q2 数据安全合规检查 - 核心业务系统',
            '核心交易系统季度现场检查，发现若干高优先级问题',
            '2026-06-10', '2026-07-10',
            [1, 2, 4, 5], // 不符合项（产生缺口）
            [3, 6, 8],    // 通过项
            [7]           // 不适用项
        );

        $this->seedChecklistRecord(
            $checklist1, $complianceMgr, $admin,
            '2026年Q2 数据安全合规检查 - 会员中心系统',
            '用户画像和会员系统，个人信息保护重点检查',
            '2026-06-12', '2026-07-05',
            [2, 8],      // 不符合项
            [1, 3, 4, 5, 6, 7],
            []
        );

        $this->seedChecklistRecord(
            $checklist2, $admin, $complianceMgr,
            '2026年6月 网络与运维巡检 - 生产区',
            '生产区服务器与网络设备月度巡检',
            '2026-06-05', '2026-06-20',
            [2, 5],      // 不符合项
            [1, 3, 4],
            []
        );

        // 4. 额外手动录入2个缺口（非检查清单产生）
        $this->createManualGap(
            'GDPR数据主体权利请求响应流程未建立',
            '业务系统上线后，未建立DSAR（数据主体访问/删除/更正请求）的标准处理流程和SLA，收到海外用户请求后无法合规响应。',
            'high', '合规制度',
            $complianceMgr,
            '2026-06-01', '2026-07-30',
            'open',
            '欧盟用户多次邮件请求删除个人信息，无统一处理工单系统',
            '建立DSAR处理工单流程+48小时响应SLA+法务审核节点'
        );

        $this->createManualGap(
            '核心数据库未启用字段级脱敏',
            '开发、测试、BI报表环境使用真实生产数据，手机号、身份证、地址未脱敏，有大规模泄露风险。',
            'critical', '数据安全',
            $admin,
            '2026-06-03', '2026-06-25',
            'in_progress',
            '历史原因未部署动态脱敏产品；研发资源不足',
            '采购并部署动态数据脱敏网关，本月内完成核心库POC'
        );

        // 5. 创建提醒规则
        ReminderRule::create([
            'name' => '缺口整改到期前7天提醒责任人',
            'description' => '距离整改期限不足7天时，向责任人发送站内通知+邮件',
            'type' => 'gap_due',
            'trigger_condition' => 'before_due',
            'trigger_value' => 7,
            'time_unit' => 'day',
            'reminder_interval_hours' => 24,
            'max_reminders' => 3,
            'channel' => 'in_app',
            'recipient_roles' => ['user', 'compliance_manager'],
            'recipient_user_ids' => [],
            'template' => '【合规缺口提醒】{title}（{gap_no}）将于 {due_date} 到期，请 {responsible} 及时处理。严重程度：{severity}',
            'priority' => 'high',
            'is_enabled' => true,
            'created_by' => $complianceMgr->id,
        ]);

        $rule2 = ReminderRule::create([
            'name' => '缺口整改逾期升级通知项目秘书',
            'description' => '超期1天未关闭的缺口，通知升级到项目秘书并抄送合规经理',
            'type' => 'gap_overdue',
            'trigger_condition' => 'after_due',
            'trigger_value' => 1,
            'time_unit' => 'day',
            'reminder_interval_hours' => 12,
            'max_reminders' => 0,
            'channel' => 'email',
            'recipient_roles' => ['project_secretary', 'compliance_manager'],
            'recipient_user_ids' => [],
            'template' => '⚠️【逾期升级】缺口 {title}（{gap_no}）已于 {due_date} 到期未关闭，请立即推动责任人处理，已升级通知 {project_secretary}。',
            'priority' => 'urgent',
            'is_enabled' => true,
            'created_by' => $complianceMgr->id,
        ]);

        ReminderRule::create([
            'name' => '待审核缺口超过48小时提醒合规经理',
            'description' => '缺口处理完成后等待审核超过48小时未处理的，自动提醒合规经理复核',
            'type' => 'review_pending',
            'trigger_condition' => 'after_due',
            'trigger_value' => 48,
            'time_unit' => 'hour',
            'reminder_interval_hours' => 6,
            'max_reminders' => 5,
            'channel' => 'in_app',
            'recipient_roles' => ['compliance_manager'],
            'recipient_user_ids' => [],
            'template' => '【审核待办】缺口 {title}（{gap_no}）已等待审核超过48小时，请尽快复核处理结果。',
            'priority' => 'normal',
            'is_enabled' => true,
            'created_by' => $complianceMgr->id,
        ]);

        // 6. 模拟发送提醒日志
        $gaps = ComplianceGap::limit(3)->get();
        foreach ($gaps as $gap) {
            for ($i = 0; $i < rand(2, 5); $i++) {
                ReminderLog::create([
                    'reminder_rule_id' => $rule2->id,
                    'notifiable_type' => 'App\\Models\\ComplianceGap',
                    'notifiable_id' => $gap->id,
                    'recipient_id' => $users->random()->id,
                    'title' => '【缺口提醒】' . $gap->title,
                    'content' => '缺口编号 ' . $gap->gap_no . ' 严重程度 ' . $gap->severity . ' 请及时处理。详情：' . \Illuminate\Support\Str::limit($gap->description, 100),
                    'channel' => collect(['email', 'in_app', 'sms'])->random(),
                    'sent_at' => now()->subHours(rand(1, 72)),
                    'read_at' => rand(0, 1) ? now()->subHours(rand(0, 10)) : null,
                ]);
            }
        }

        // 7. 保存筛选条件
        SavedFilter::create([
            'name' => '高/紧急严重度待处理缺口',
            'page' => 'compliance-gaps.index',
            'user_id' => $complianceMgr->id,
            'filter_criteria' => ['severity' => ['critical', 'high'], 'status' => ['open', 'in_progress']],
            'is_public' => true,
        ]);
        SavedFilter::create([
            'name' => '我的逾期超过30天',
            'page' => 'compliance-gaps.index',
            'user_id' => $complianceMgr->id,
            'filter_criteria' => ['responsible_user_id' => $complianceMgr->id, 'overdue_days_min' => 30],
            'is_public' => false,
        ]);
        SavedFilter::create([
            'name' => '本月已关闭审核',
            'page' => 'checklist-records.index',
            'user_id' => $complianceMgr->id,
            'filter_criteria' => ['status' => ['reviewed', 'closed'], 'check_date_from' => now()->startOfMonth()->toDateString()],
            'is_public' => true,
        ]);

        // 8. 下载记录日志
        $allGaps = ComplianceGap::all();
        for ($i = 0; $i < 8; $i++) {
            $gap = $allGaps->random();
            DownloadLog::create([
                'user_id' => $users->random()->id,
                'downloadable_type' => 'App\\Models\\ComplianceGap',
                'downloadable_id' => $gap->id,
                'download_type' => 'evidence',
                'file_name' => $gap->gap_no . '_证据材料_' . $i . '.pdf',
                'file_path' => 'evidences/' . $gap->gap_no . '/' . $i . '.pdf',
                'file_size' => rand(102400, 5242880),
                'filter_criteria' => ['gap_id' => $gap->id, 'type' => 'evidence'],
                'created_at' => now()->subDays(rand(1, 30)),
            ]);
        }
        for ($i = 0; $i < 3; $i++) {
            DownloadLog::create([
                'user_id' => $complianceMgr->id,
                'downloadable_type' => 'App\\Models\\ChecklistRecord',
                'downloadable_id' => ChecklistRecord::all()->random()->id,
                'download_type' => 'compliance_summary',
                'file_name' => '合规缺口导出_' . now()->subDays($i)->format('Ymd') . '.csv',
                'file_path' => 'exports/gaps_' . now()->subDays($i)->timestamp . '.csv',
                'file_format' => 'csv',
                'file_size' => rand(5120, 204800),
                'filter_criteria' => ['export_type' => 'csv', 'month' => now()->month],
                'created_at' => now()->subDays($i * 3),
            ]);
        }
    }

    /**
     * 创建检查记录，按索引指定 不符合/通过/不适用 项
     */
    private function seedChecklistRecord(
        Checklist $checklist, User $creator, User $resp,
        $title, $desc, $checkDate, $dueDate,
        array $failIdx, array $passIdx, array $naIdx
    ) {
        $items = $checklist->items()->orderBy('sort_order')->get();

        $record = ChecklistRecord::create([
            'checklist_id' => $checklist->id,
            'title' => $title,
            'description' => $desc,
            'check_date' => $checkDate,
            'due_date' => $dueDate,
            'department' => $creator->department,
            'responsible_user_id' => $resp->id,
            'reviewer_user_id' => User::where('role', User::ROLE_COMPLIANCE_MANAGER)->first()->id,
            'created_by' => $creator->id,
            'status' => rand(0, 1) ? 'submitted' : 'reviewed',
        ]);

        $gapCounter = 0;
        foreach ($items as $idxOffset => $item) {
            $realIdx = $idxOffset + 1;
            if (in_array($realIdx, $failIdx)) {
                $result = rand(0, 1) ? 'fail' : 'partial';
                $hasGap = true;
            } elseif (in_array($realIdx, $passIdx)) {
                $result = 'pass';
                $hasGap = false;
            } else {
                $result = in_array($realIdx, $naIdx) ? 'na' : 'pending';
                $hasGap = false;
            }

            $recordItem = ChecklistRecordItem::create([
                'checklist_record_id' => $record->id,
                'checklist_item_id' => $item->id,
                'result' => $result,
                'evidence' => $result === 'pass' ? '现场截图/日志/配置导出留存' : null,
                'remark' => $hasGap ? ('【问题描述】' . $item->title . ' - 抽查发现存在不符合项，详见整改建议。') : null,
                'has_gap' => $hasGap,
            ]);

            if ($hasGap) {
                $gapCounter++;
                $severityMap = ['low' => 'low', 'medium' => 'medium', 'high' => 'high'];
                $gap = ComplianceGap::create([
                    'title' => $item->title . ' 合规问题',
                    'description' => "来自检查记录「{$record->title}」第 {$realIdx} 项检查：{$recordItem->remark}\n\n原判定标准：{$item->criteria}",
                    'severity' => $severityMap[$item->risk_level] ?? 'medium',
                    'category' => $item->category ?: '其他',
                    'status' => collect(['open', 'in_progress', 'pending_review', 'resolved'])->random(),
                    'responsible_user_id' => $resp->id,
                    'created_by' => $creator->id,
                    'checklist_record_id' => $record->id,
                    'checklist_item_id' => $item->id,
                    'discovered_date' => $checkDate,
                    'due_date' => $dueDate,
                    'source_type' => 'checklist',
                    'gap_no' => null,
                    'root_cause' => rand(0, 1) ? '历史系统技术债，补丁未及时跟进' : '管理制度缺失，流程未形成闭环',
                    'corrective_action' => '立即整改：1) 补充配置 2) 责任人确认 3) 回归验证 4) 纳入下轮检查',
                ]);

                // 处理日志
                GapHandlingLog::create([
                    'compliance_gap_id' => $gap->id,
                    'user_id' => $resp->id,
                    'action_type' => 'created',
                    'comment' => '由检查记录自动生成缺口',
                ]);
                if ($gap->status !== 'open') {
                    GapHandlingLog::create([
                        'compliance_gap_id' => $gap->id,
                        'user_id' => $resp->id,
                        'action_type' => 'status_changed',
                        'new_value' => $gap->status,
                        'comment' => '责任人已确认，正在制定整改计划',
                    ]);
                }
                if (in_array($gap->status, ['pending_review', 'resolved', 'closed'])) {
                    GapHandlingLog::create([
                        'compliance_gap_id' => $gap->id,
                        'user_id' => $resp->id,
                        'action_type' => 'resolved',
                        'comment' => '整改完成，提交复核',
                    ]);
                }

                // 证据材料（1-2份）
                for ($e = 0; $e < rand(1, 2); $e++) {
                    GapEvidence::create([
                        'compliance_gap_id' => $gap->id,
                        'uploaded_by' => $resp->id,
                        'file_name' => "gap_{$gap->id}_evidence_{$e}.pdf",
                        'file_path' => "evidences/{$gap->gap_no}/evidence_{$e}.pdf",
                        'file_size' => rand(102400, 2097152),
                        'description' => '整改' . ($e + 1) . '：配置截图 + 变更记录',
                    ]);
                }

                $recordItem->update(['gap_id' => $gap->id]);
            }
        }

        $record->update(['gap_count' => $gapCounter]);
        return $record;
    }

    private function createManualGap(
        $title, $description, $severity, $category,
        User $resp, $discovered, $due, $status,
        $rootCause, $action
    ) {
        $gap = ComplianceGap::create([
            'title' => $title,
            'description' => $description,
            'severity' => $severity,
            'category' => $category,
            'status' => $status,
            'responsible_user_id' => $resp->id,
            'created_by' => User::where('role', User::ROLE_COMPLIANCE_MANAGER)->first()->id,
            'discovered_date' => $discovered,
            'due_date' => $due,
            'source_type' => 'manual',
            'gap_no' => null,
            'root_cause' => $rootCause,
            'corrective_action' => $action,
        ]);

        GapHandlingLog::create([
            'compliance_gap_id' => $gap->id,
            'user_id' => User::where('role', User::ROLE_COMPLIANCE_MANAGER)->first()->id,
            'action_type' => 'created',
            'comment' => '合规经理手动录入',
        ]);

        if ($status !== 'open') {
            GapHandlingLog::create([
                'compliance_gap_id' => $gap->id,
                'user_id' => $resp->id,
                'action_type' => 'status_changed',
                'new_value' => $status,
                'comment' => '已启动整改，预计按期完成',
            ]);
        }

        return $gap;
    }
}
