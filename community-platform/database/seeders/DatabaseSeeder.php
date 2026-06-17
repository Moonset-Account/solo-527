<?php

namespace Database\Seeders;

use App\Models\AssistanceRequest;
use App\Models\Department;
use App\Models\ExceptionLog;
use App\Models\GridEvent;
use App\Models\Issue;
use App\Models\IssueVote;
use App\Models\PublicNotice;
use App\Models\User;
use App\Services\ParticipationStatService;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $dept1 = Department::create(['name' => '市政工程部门', 'description' => '负责社区公共设施维护']);
        $dept2 = Department::create(['name' => '环境卫生部门', 'description' => '负责社区清洁和垃圾处理']);
        $dept3 = Department::create(['name' => '社会治安部门', 'description' => '负责社区安全和秩序']);
        $dept4 = Department::create(['name' => '民政服务部门', 'description' => '负责居民帮扶和福利']);

        $admin = User::create([
            'name' => '平台管理员',
            'email' => 'admin@community.com',
            'password' => bcrypt('123456'),
            'role' => 'admin',
        ]);

        $staff1 = User::create([
            'name' => '市政李工',
            'email' => 'staff1@community.com',
            'password' => bcrypt('123456'),
            'role' => 'department',
            'department_id' => $dept1->id,
        ]);

        $staff2 = User::create([
            'name' => '环卫张工',
            'email' => 'staff2@community.com',
            'password' => bcrypt('123456'),
            'role' => 'department',
            'department_id' => $dept2->id,
        ]);

        $staff3 = User::create([
            'name' => '治安王警官',
            'email' => 'staff3@community.com',
            'password' => bcrypt('123456'),
            'role' => 'department',
            'department_id' => $dept3->id,
        ]);

        $rep = User::create([
            'name' => '居民代表刘阿姨',
            'email' => 'rep@community.com',
            'password' => bcrypt('123456'),
            'role' => 'representative',
        ]);

        $resident1 = User::create([
            'name' => '居民陈先生',
            'email' => 'chen@community.com',
            'password' => bcrypt('123456'),
            'role' => 'resident',
        ]);

        $resident2 = User::create([
            'name' => '居民李女士',
            'email' => 'li@community.com',
            'password' => bcrypt('123456'),
            'role' => 'resident',
        ]);

        $statService = new ParticipationStatService();

        $event1 = GridEvent::create([
            'title' => '路灯损坏',
            'description' => '3号楼前路灯不亮，晚上出行不安全',
            'location' => '3号楼前',
            'status' => 'pending',
            'reporter_id' => $resident1->id,
            'event_time' => now()->subDays(2),
        ]);

        $event2 = GridEvent::create([
            'title' => '下水道堵塞',
            'description' => '小区北门下水道堵塞，污水外溢',
            'location' => '小区北门',
            'status' => 'processing',
            'reporter_id' => $resident2->id,
            'handler_id' => $staff1->id,
            'department_id' => $dept1->id,
            'event_time' => now()->subDays(5),
        ]);

        $event3 = GridEvent::create([
            'title' => '健身器材故障',
            'description' => '广场上单杠螺丝松动，有安全隐患',
            'location' => '社区广场',
            'status' => 'resolved',
            'reporter_id' => $rep->id,
            'handler_id' => $staff1->id,
            'department_id' => $dept1->id,
            'event_time' => now()->subDays(10),
            'resolved_at' => now()->subDays(3),
        ]);

        $statService->incrementStat($resident1, 'event_count');
        $statService->incrementStat($resident2, 'event_count');
        $statService->incrementStat($rep, 'event_count');

        $issue1 = Issue::create([
            'title' => '建议增设小区监控',
            'description' => '近期小区内电瓶车失窃案件时有发生，建议在关键路口增设监控摄像头',
            'category' => '公共安全',
            'status' => 'voting',
            'reporter_id' => $resident1->id,
        ]);

        $issue2 = Issue::create([
            'title' => '延长垃圾分类投放时间',
            'description' => '现有投放时间早7-9，晚6-8，很多双职工家庭赶不上，建议延长时间',
            'category' => '环境卫生',
            'status' => 'assigned',
            'reporter_id' => $resident2->id,
            'department_id' => $dept2->id,
            'assigner_id' => $admin->id,
            'deadline' => now()->addDays(15),
        ]);

        $issue3 = Issue::create([
            'title' => '增设老年活动中心',
            'description' => '小区内缺少老年人室内活动场所，建议利用现有闲置空间改造',
            'category' => '社区服务',
            'status' => 'resolved',
            'reporter_id' => $rep->id,
            'department_id' => $dept4->id,
            'assigner_id' => $admin->id,
        ]);

        $statService->incrementStat($resident1, 'issue_count');
        $statService->incrementStat($resident2, 'issue_count');
        $statService->incrementStat($rep, 'issue_count');

        IssueVote::create(['issue_id' => $issue1->id, 'user_id' => $resident2->id]);
        IssueVote::create(['issue_id' => $issue1->id, 'user_id' => $rep->id]);
        $statService->incrementStat($resident2, 'vote_count');
        $statService->incrementStat($rep, 'vote_count');

        $assistance1 = AssistanceRequest::create([
            'title' => '独居老人上门照料',
            'description' => '5号楼王奶奶82岁独居，行动不便，需要定期上门帮助买菜和打扫卫生',
            'resident_id' => $resident1->id,
            'status' => 'pending',
        ]);

        $assistance2 = AssistanceRequest::create([
            'title' => '残疾人就业帮扶',
            'description' => '2号楼张先生腿部残疾，希望能在家就业，需要技能培训和岗位对接',
            'resident_id' => $resident2->id,
            'status' => 'in_progress',
            'department_id' => $dept4->id,
            'handler_id' => $staff3->id,
        ]);

        $assistance3 = AssistanceRequest::create([
            'title' => '低保户子女学费资助',
            'description' => '4号楼赵同学考上大学，家庭困难，需要学费资助',
            'resident_id' => $rep->id,
            'status' => 'completed',
            'department_id' => $dept4->id,
            'handler_id' => $staff3->id,
            'deadline' => now()->subDays(10),
            'completed_at' => now()->subDays(5),
        ]);

        $assistance4 = AssistanceRequest::create([
            'title' => '紧急医疗救助',
            'description' => '1号楼李大爷突发心脏病，需要紧急医疗救助',
            'resident_id' => $resident1->id,
            'status' => 'overdue',
            'department_id' => $dept4->id,
            'handler_id' => $staff3->id,
            'deadline' => now()->subDays(3),
        ]);

        $statService->incrementStat($resident1, 'assistance_count');
        $statService->incrementStat($resident2, 'assistance_count');
        $statService->incrementStat($rep, 'assistance_count');

        PublicNotice::create([
            'title' => '健身器材修复完成公示',
            'content' => '社区广场健身器材已于3日前修复完成，现已恢复正常使用。感谢居民代表刘阿姨的及时反映和市政部门的快速处理。',
            'type' => 'grid_event',
            'reference_id' => $event3->id,
            'published_by' => $admin->id,
            'published_at' => now()->subDays(3),
        ]);

        PublicNotice::create([
            'title' => '老年活动中心改造完成',
            'content' => '经过为期2个月的改造，小区原活动室已升级为标准化老年活动中心，配备棋牌室、书画室、健身区。开放时间：每日8:00-20:00。',
            'type' => 'assistance',
            'reference_id' => $assistance3->id,
            'published_by' => $admin->id,
            'published_at' => now()->subDays(2),
        ]);

        PublicNotice::create([
            'title' => '增设监控设施方案公示',
            'content' => '根据居民建议，拟在小区增设8处监控摄像头，具体位置见附件图纸。如有异议请于7日内到居委会反馈。',
            'type' => 'issue',
            'reference_id' => $issue3->id,
            'published_by' => $admin->id,
            'published_at' => now()->subDay(),
        ]);

        ExceptionLog::create([
            'type' => 'notification',
            'reference_id' => $issue1->id,
            'error_message' => '短信通知发送超时：服务商返回网关超时错误',
            'status' => 'pending',
            'retry_count' => 2,
            'payload' => ['phone' => '138****8888', 'template' => 'vote_notify'],
        ]);

        ExceptionLog::create([
            'type' => 'payment',
            'reference_id' => $assistance3->id,
            'error_message' => '资助款项支付失败：账户余额不足',
            'status' => 'pending',
            'retry_count' => 1,
            'payload' => ['amount' => 5000, 'payee' => '赵同学'],
        ]);
    }
}
