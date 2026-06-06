<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use App\Models\User;
use App\Models\Member;
use App\Models\Coach;
use App\Models\CourseType;
use App\Models\CoachAvailableTime;
use App\Models\MemberCoursePackage;
use App\Services\BookingService;
use App\Services\AttendanceService;
use App\Services\LeaveRequestService;
use App\Services\TransferRequestService;
use App\Services\RefundRequestService;
use App\Services\NotificationService;
use App\Enums\UserRole;

class DatabaseSeeder extends Seeder
{
    protected $bookingService;
    protected $attendanceService;
    protected $leaveRequestService;
    protected $transferRequestService;
    protected $refundRequestService;
    protected $notificationService;

    public function __construct(
        BookingService $bookingService,
        AttendanceService $attendanceService,
        LeaveRequestService $leaveRequestService,
        TransferRequestService $transferRequestService,
        RefundRequestService $refundRequestService,
        NotificationService $notificationService
    ) {
        $this->bookingService = $bookingService;
        $this->attendanceService = $attendanceService;
        $this->leaveRequestService = $leaveRequestService;
        $this->transferRequestService = $transferRequestService;
        $this->refundRequestService = $refundRequestService;
        $this->notificationService = $notificationService;
    }

    public function run(): void
    {
        $this->command->info('开始创建演示数据...');

        $adminUser = $this->createAdmin();
        $supervisorUser = $this->createSupervisor();
        $frontdeskUser = $this->createFrontdesk();

        [$coach1User, $coach1] = $this->createCoach('张教练', 'coach1@example.com', '13800138001');
        [$coach2User, $coach2] = $this->createCoach('李教练', 'coach2@example.com', '13800138002');

        $courseTypes = $this->createCourseTypes();

        $this->assignCourseTypesToCoach($coach1, [$courseTypes[0]->id, $courseTypes[1]->id]);
        $this->assignCourseTypesToCoach($coach2, [$courseTypes[1]->id, $courseTypes[2]->id]);

        $this->createCoachAvailableTimes($coach1);
        $this->createCoachAvailableTimes($coach2);

        [$member1User, $member1] = $this->createMember('王小明', 'member1@example.com', '13900139001');
        [$member2User, $member2] = $this->createMember('李小红', 'member2@example.com', '13900139002');
        [$member3User, $member3] = $this->createMember('张三', 'member3@example.com', '13900139003');

        $package1 = $this->createCoursePackage($member1, $courseTypes[0], '减脂塑形私教课10节', 10, 300);
        $package2 = $this->createCoursePackage($member1, $courseTypes[1], '力量训练私教课20节', 20, 280);
        $package3 = $this->createCoursePackage($member2, $courseTypes[1], '力量训练私教课10节', 10, 280);
        $package4 = $this->createCoursePackage($member3, $courseTypes[2], '康复训练私教课15节', 15, 350);

        $this->command->info('场景1: 创建正常预约');
        $booking1 = $this->bookingService->createBooking([
            'member_id' => $member1->id,
            'coach_id' => $coach1->id,
            'course_type_id' => $courseTypes[0]->id,
            'package_id' => $package1->id,
            'start_time' => Carbon::now()->addDays(2)->setTime(10, 0, 0),
            'notes' => '希望侧重腹部训练',
        ], $frontdeskUser->id);
        $this->command->info("  - 预约1创建成功: #{$booking1->id}");

        $booking2 = $this->bookingService->createBooking([
            'member_id' => $member2->id,
            'coach_id' => $coach1->id,
            'course_type_id' => $courseTypes[1]->id,
            'package_id' => $package3->id,
            'start_time' => Carbon::now()->addDays(2)->setTime(14, 0, 0),
            'notes' => '腿部力量训练',
        ], $frontdeskUser->id);
        $this->command->info("  - 预约2创建成功: #{$booking2->id}");

        $this->command->info('场景2: 预约冲突 - 同一时段重复预约');
        try {
            $this->bookingService->createBooking([
                'member_id' => $member3->id,
                'coach_id' => $coach1->id,
                'course_type_id' => $courseTypes[0]->id,
                'package_id' => $package4->id,
                'start_time' => Carbon::now()->addDays(2)->setTime(10, 0, 0),
                'notes' => '测试冲突',
            ], $frontdeskUser->id);
        } catch (\Exception $e) {
            $this->command->warn("  - 冲突检测正常: {$e->getMessage()}");
        }

        $this->command->info('场景3: 会员签到');
        $booking3 = $this->bookingService->createBooking([
            'member_id' => $member1->id,
            'coach_id' => $coach1->id,
            'course_type_id' => $courseTypes[0]->id,
            'package_id' => $package1->id,
            'start_time' => Carbon::now()->subHour()->setTime(9, 0, 0),
            'notes' => '已完成的课程',
        ], $frontdeskUser->id);

        $attendance1 = $this->attendanceService->memberSelfCheckIn($booking3->id, $member1->id);
        $this->command->info("  - 签到成功: 会员 {$member1->user->name} 完成签到");

        $this->command->info('场景4: 教练代签到，需要主管复核');
        $booking4 = $this->bookingService->createBooking([
            'member_id' => $member2->id,
            'coach_id' => $coach2->id,
            'course_type_id' => $courseTypes[1]->id,
            'package_id' => $package3->id,
            'start_time' => Carbon::now()->subHours(2)->setTime(14, 0, 0),
            'notes' => '教练代签课程',
        ], $frontdeskUser->id);

        $attendance2 = $this->attendanceService->coachSign($booking4->id, $coach2User->id, '会员按时到课，训练认真');
        $this->command->info("  - 教练代签成功，状态为待复核: #{$attendance2->id}");

        $this->command->info('场景5: 主管批准代签');
        $this->attendanceService->approveCoachSign($attendance2->id, $supervisorUser->id, '确认代签有效');
        $this->command->info("  - 主管批准代签成功");

        $this->command->info('场景6: 请假申请 - 提交、撤回、重新提交、最终批准');
        $booking5 = $this->bookingService->createBooking([
            'member_id' => $member3->id,
            'coach_id' => $coach2->id,
            'course_type_id' => $courseTypes[2]->id,
            'package_id' => $package4->id,
            'start_time' => Carbon::now()->addDays(5)->setTime(16, 0, 0),
            'notes' => '康复训练课',
        ], $frontdeskUser->id);

        $leave1 = $this->leaveRequestService->createRequest([
            'booking_id' => $booking5->id,
            'reason' => '临时有事，需要请假',
        ], $member3User->id);
        $this->command->info("  - 请假申请提交: #{$leave1->id}");

        $this->leaveRequestService->withdrawRequest($leave1->id, $member3User->id);
        $this->command->info("  - 请假申请已撤回");

        $leave2 = $this->leaveRequestService->resubmitRequest($leave1->id, $member3User->id, '身体不适，确实无法上课');
        $this->command->info("  - 请假申请重新提交: #{$leave2->id}");

        $this->leaveRequestService->approveRequest($leave2->id, $frontdeskUser->id, '批准请假');
        $this->command->info("  - 请假申请已批准");

        $this->command->info('场景7: 转课申请 - 提交、批准');
        $transfer1 = $this->transferRequestService->createRequest([
            'member_id' => $member2->id,
            'from_coach_id' => $coach1->id,
            'to_coach_id' => $coach2->id,
            'course_type_id' => $courseTypes[1]->id,
            'lessons_count' => 5,
            'reason' => '想尝试不同教练的教学风格',
        ], $frontdeskUser->id);
        $this->command->info("  - 转课申请提交: #{$transfer1->id}");

        $this->transferRequestService->approveRequest($transfer1->id, $supervisorUser->id, '批准转课，已调整教练课时和门店收入');
        $this->command->info("  - 转课申请已批准，教练课时和门店收入已调整");

        $this->command->info('场景8: 退款申请 - 提交、批准、完成');
        $refund1 = $this->refundRequestService->createRequest([
            'package_id' => $package4->id,
            'refund_lessons' => 3,
            'reason' => '搬家离店太远，不方便上课',
        ], $member3User->id);
        $this->command->info("  - 退款申请提交: #{$refund1->id}");

        $this->refundRequestService->approveRequest($refund1->id, $adminUser->id, '批准退款，前台尽快处理');
        $this->command->info("  - 退款申请已批准（未扣减教练已确认课时）");

        $this->refundRequestService->completeRefund($refund1->id, $frontdeskUser->id);
        $this->command->info("  - 退款已完成，已调整教练课时和会员余额");

        $this->command->info('场景9: 取消预约 - 超期扣课时');
        $booking6 = $this->bookingService->createBooking([
            'member_id' => $member1->id,
            'coach_id' => $coach1->id,
            'course_type_id' => $courseTypes[0]->id,
            'package_id' => $package1->id,
            'start_time' => Carbon::now()->addHours(12),
            'notes' => '测试超期取消',
        ], $frontdeskUser->id);

        $booking6->cancellation_deadline_hours = 24;
        $booking6->save();

        $balanceBefore = $package1->remaining_lessons;
        $this->bookingService->cancelBooking($booking6->id, '临时有事', $frontdeskUser->id);
        $package1->refresh();
        $balanceAfter = $package1->remaining_lessons;

        if ($balanceBefore > $balanceAfter) {
            $this->command->info("  - 预约已取消，已扣除课时（{$balanceBefore} -> {$balanceAfter}）");
        } else {
            $this->command->info("  - 预约已取消，未扣除课时");
        }

        $this->command->info('场景10: 创建一些通知失败记录进入重试队列');
        $this->createFailedNotifications($member1User, $member2User);
        $this->command->info("  - 已创建失败通知，将进入重试队列");

        $this->command->info('');
        $this->command->info('========================================');
        $this->command->info('演示数据创建完成！');
        $this->command->info('========================================');
        $this->command->info("管理员账号: admin@example.com / password");
        $this->command->info("主管账号: supervisor@example.com / password");
        $this->command->info("前台账号: frontdesk@example.com / password");
        $this->command->info("教练账号: coach1@example.com, coach2@example.com / password");
        $this->command->info("会员账号: member1@example.com, member2@example.com, member3@example.com / password");
        $this->command->info('========================================');
    }

    protected function createAdmin()
    {
        return User::create([
            'name' => '系统管理员',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'phone' => '13000000001',
            'role' => UserRole::ADMIN->value,
        ]);
    }

    protected function createSupervisor()
    {
        return User::create([
            'name' => '刘主管',
            'email' => 'supervisor@example.com',
            'password' => Hash::make('password'),
            'phone' => '13000000002',
            'role' => UserRole::SUPERVISOR->value,
        ]);
    }

    protected function createFrontdesk()
    {
        return User::create([
            'name' => '陈前台',
            'email' => 'frontdesk@example.com',
            'password' => Hash::make('password'),
            'phone' => '13000000003',
            'role' => UserRole::FRONTDESK->value,
        ]);
    }

    protected function createCoach($name, $email, $phone)
    {
        static $coachNo = 1;
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make('password'),
            'phone' => $phone,
            'role' => UserRole::COACH->value,
        ]);

        $coach = Coach::create([
            'user_id' => $user->id,
            'employee_no' => 'C' . str_pad($coachNo++, 4, '0', STR_PAD_LEFT),
            'gender' => 'male',
            'specialties' => ['减脂塑形', '力量训练', '康复训练'],
            'certifications' => ['ACE认证教练', '国家一级运动员'],
            'experience_years' => rand(3, 8),
            'bio' => '专业健身教练，拥有丰富的教学经验',
            'rating' => 4.8,
        ]);

        return [$user, $coach];
    }

    protected function createMember($name, $email, $phone)
    {
        static $memberNo = 1;
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make('password'),
            'phone' => $phone,
            'role' => UserRole::MEMBER->value,
        ]);

        $member = Member::create([
            'user_id' => $user->id,
            'member_no' => 'M' . str_pad($memberNo++, 4, '0', STR_PAD_LEFT),
            'gender' => rand(0, 1) ? 'male' : 'female',
            'birthday' => Carbon::now()->subYears(rand(20, 45)),
            'height' => rand(155, 190) / 10,
            'weight' => rand(50, 90),
            'fitness_goal' => '减脂塑形，增强体质',
            'health_condition' => '健康状况良好',
            'join_date' => Carbon::now()->subMonths(rand(1, 12)),
            'expire_date' => Carbon::now()->addYears(1),
        ]);

        return [$user, $member];
    }

    protected function createCourseTypes()
    {
        return [
            CourseType::create([
                'name' => '减脂塑形课',
                'description' => '针对减脂塑形目标的专项私教课程',
                'duration_minutes' => 60,
                'price' => 300,
                'coach_commission' => 120,
                'is_active' => true,
                'color' => '#FF6B6B',
            ]),
            CourseType::create([
                'name' => '力量训练课',
                'description' => '增强肌肉力量的专业训练课程',
                'duration_minutes' => 60,
                'price' => 280,
                'coach_commission' => 100,
                'is_active' => true,
                'color' => '#4ECDC4',
            ]),
            CourseType::create([
                'name' => '康复训练课',
                'description' => '运动损伤康复与体态调整课程',
                'duration_minutes' => 60,
                'price' => 350,
                'coach_commission' => 150,
                'is_active' => true,
                'color' => '#45B7D1',
            ]),
        ];
    }

    protected function assignCourseTypesToCoach($coach, $courseTypeIds)
    {
        $coach->courseTypes()->sync($courseTypeIds);
    }

    protected function createCoachAvailableTimes($coach)
    {
        $days = range(1, 5);
        foreach ($days as $day) {
            CoachAvailableTime::create([
                'coach_id' => $coach->id,
                'day_of_week' => $day,
                'start_time' => '09:00:00',
                'end_time' => '12:00:00',
                'is_recurring' => true,
                'is_active' => true,
            ]);

            CoachAvailableTime::create([
                'coach_id' => $coach->id,
                'day_of_week' => $day,
                'start_time' => '14:00:00',
                'end_time' => '21:00:00',
                'is_recurring' => true,
                'is_active' => true,
            ]);
        }

        CoachAvailableTime::create([
            'coach_id' => $coach->id,
            'day_of_week' => 6,
            'start_time' => '10:00:00',
            'end_time' => '18:00:00',
            'is_recurring' => true,
            'is_active' => true,
        ]);
    }

    protected function createCoursePackage($member, $courseType, $name, $lessons, $unitPrice)
    {
        return MemberCoursePackage::create([
            'member_id' => $member->id,
            'course_type_id' => $courseType->id,
            'package_name' => $name,
            'total_lessons' => $lessons,
            'used_lessons' => 0,
            'remaining_lessons' => $lessons,
            'unit_price' => $unitPrice,
            'total_amount' => $lessons * $unitPrice,
            'paid_amount' => $lessons * $unitPrice,
            'purchase_date' => Carbon::now()->subDays(rand(1, 30)),
            'expire_date' => Carbon::now()->addYears(1),
        ]);
    }

    protected function createFailedNotifications($user1, $user2)
    {
        \App\Models\Notification::create([
            'user_id' => $user1->id,
            'type' => 'sms_test',
            'channel' => 'sms',
            'title' => '课程提醒',
            'content' => '您明天有课程，请准时参加',
            'data' => ['booking_id' => 1],
            'status' => 'pending_retry',
            'retry_count' => 1,
            'max_retries' => 3,
            'error_message' => '短信服务暂时不可用',
            'next_retry_at' => Carbon::now()->addMinutes(5),
        ]);

        \App\Models\Notification::create([
            'user_id' => $user2->id,
            'type' => 'email_test',
            'channel' => 'email',
            'title' => '课时即将到期提醒',
            'content' => '您的课时包即将到期，请尽快使用',
            'data' => ['package_id' => 1],
            'status' => 'failed',
            'retry_count' => 3,
            'max_retries' => 3,
            'error_message' => '邮件服务连接超时',
        ]);
    }
}
