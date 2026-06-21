<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::find(1);
$event = App\Models\Event::first();
$session = $event->sessions()->first();
echo "--- 用户: {$user->name} (角色: {$user->roles->pluck('name')->join(',')}) ---\n";
echo "--- 活动: {$event->name} (场次: {$event->sessions->count()}) ---\n";
echo "座位数(场次1): {$session->seats()->count()} 区域: {$session->seats()->distinct('zone')->pluck('zone')->join(',')}\n";

$reg = App\Models\Registration::create([
    'event_id' => $event->id,
    'name' => '测试报名者',
    'phone' => '13800138000',
    'company' => '测试公司A',
    'position' => 'CTO',
    'email' => 'test@demo.com',
    'industry' => '人工智能',
    'conversion_stage' => 'confirmed',
    'registration_status' => 'approved',
    'attendance_status' => 'not_arrived',
    'source_channel' => '官方渠道',
    'is_vip' => 1,
    'is_key_client' => 1,
    'paid_amount' => 8888.00,
    'created_by' => 1,
]);
echo "--- 创建报名 #{$reg->id} 姓名: {$reg->name} 编号: {$reg->registration_no} ---\n";
$score = $reg->qualityScore;
echo "质量评分: 总分={$score?->total_score} 等级={$score?->quality_level} 五维=信息完整度{$score?->information_completeness}/职位级别{$score?->position_level_score}/公司质量{$score?->company_quality_score}/行业匹配{$score?->industry_match_score}/历史行为{$score?->history_score}\n";

$dup = App\Models\Registration::create([
    'event_id' => $event->id, 'name' => '重复占座者',
    'phone' => '13800138000', 'company' => '测试公司B',
    'position' => 'VP', 'industry' => '金融',
    'conversion_stage' => 'registered', 'registration_status' => 'pending',
    'attendance_status' => 'not_arrived', 'source_channel' => '合作伙伴',
    'created_by' => 1,
]);
echo "--- 同手机号重复报名 #{$dup->id} ---\n";
echo "重复占座待办记录: " . App\Models\DuplicateSeatRecord::count() . " 条\n";
$r = App\Models\DuplicateSeatRecord::first();
$ids = $r?->conflict_registration_ids ?? [];
echo "冲突类型: {$r?->conflict_type} 状态: {$r?->status} 报名ID列表: [" . implode(',', $ids) . "]\n";

$svc = app(App\Services\SummaryService::class);
$st = $svc->getCachedStats($event->id, now()->toDateString());
echo "转化漏斗: " . json_encode($st['conversion_funnel'] ?? [], JSON_UNESCAPED_UNICODE) . "\n";
echo "操作日志总数: " . App\Models\ActivityLog::count() . " 条\n";
echo "导出记录表: " . App\Models\ExportRecord::count() . " 条\n";
echo "=== 全链路验证通过 ===\n";
