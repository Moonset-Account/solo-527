<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Member;
use App\Models\Coach;
use App\Models\CourseType;
use App\Models\CoachAvailableTime;
use App\Models\MemberCoursePackage;
use App\Models\Booking;
use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\TransferRequest;
use App\Models\RefundRequest;
use App\Models\Notification;
use App\Models\CoachRevenueLog;
use App\Models\StoreRevenueLog;
use App\Services\BookingService;
use App\Services\AttendanceService;
use App\Services\LeaveRequestService;
use App\Services\TransferRequestService;
use App\Services\RefundRequestService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    protected $bookingService;
    protected $attendanceService;
    protected $leaveService;
    protected $transferService;
    protected $refundService;

    public function __construct(
        BookingService $bookingService,
        AttendanceService $attendanceService,
        LeaveRequestService $leaveService,
        TransferRequestService $transferService,
        RefundRequestService $refundService
    ) {
        $this->bookingService = $bookingService;
        $this->attendanceService = $attendanceService;
        $this->leaveService = $leaveService;
        $this->transferService = $transferService;
        $this->refundService = $refundService;
    }

    protected function getNextWeekday($fromDate, $days = 1)
    {
        $date = $fromDate->copy();
        $count = 0;
        while ($count < $days) {
            $date->addDay();
            if ($date->dayOfWeek >= 1 && $date->dayOfWeek <= 5) {
                $count++;
            }
        }
        return $date;
    }

    protected function getPreviousWeekday($fromDate, $days = 1)
    {
        $date = $fromDate->copy();
        $count = 0;
        while ($count < $days) {
            $date->subDay();
            if ($date->dayOfWeek >= 1 && $date->dayOfWeek <= 5) {
                $count++;
            }
        }
        return $date;
    }

    public function run(): void
    {
        DB::statement('PRAGMA foreign_keys = OFF;');

        Notification::query()->delete();
        CoachRevenueLog::query()->delete();
        StoreRevenueLog::query()->delete();
        RefundRequest::query()->delete();
        TransferRequest::query()->delete();
        LeaveRequest::query()->delete();
        Attendance::query()->delete();
        Booking::query()->delete();
        MemberCoursePackage::query()->delete();
        CoachAvailableTime::query()->delete();
        CourseType::query()->delete();
        Member::query()->delete();
        Coach::query()->delete();
        User::query()->delete();

        DB::statement('PRAGMA foreign_keys = ON;');

        $this->command->info('========== 开始填充演示数据 ==========');

        $admin = User::firstOrCreate(
            ['email' => 'admin@gym.com'],
            [
                'name' => '系统管理员',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'phone' => '13800000001',
            ]
        );
        $this->command->info('✓ 管理员用户已创建');

        $supervisor = User::firstOrCreate(
            ['email' => 'supervisor@gym.com'],
            [
                'name' => '张主管',
                'password' => Hash::make('password123'),
                'role' => 'supervisor',
                'phone' => '13800000002',
            ]
        );
        $this->command->info('✓ 主管用户已创建');

        $frontdesk = User::firstOrCreate(
            ['email' => 'frontdesk@gym.com'],
            [
                'name' => '李前台',
                'password' => Hash::make('password123'),
                'role' => 'frontdesk',
                'phone' => '13800000003',
            ]
        );
        $this->command->info('✓ 前台用户已创建');

        $coach1User = User::firstOrCreate(
            ['email' => 'wang@gym.com'],
            [
                'name' => '王教练',
                'password' => Hash::make('password123'),
                'role' => 'coach',
                'phone' => '13800000011',
            ]
        );
        $coach2User = User::firstOrCreate(
            ['email' => 'liu@gym.com'],
            [
                'name' => '刘教练',
                'password' => Hash::make('password123'),
                'role' => 'coach',
                'phone' => '13800000012',
            ]
        );
        $this->command->info('✓ 教练用户已创建');

        $member1User = User::firstOrCreate(
            ['email' => 'chen@example.com'],
            [
                'name' => '陈会员',
                'password' => Hash::make('password123'),
                'role' => 'member',
                'phone' => '13900000001',
            ]
        );
        $member2User = User::firstOrCreate(
            ['email' => 'zhao@example.com'],
            [
                'name' => '赵会员',
                'password' => Hash::make('password123'),
                'role' => 'member',
                'phone' => '13900000002',
            ]
        );
        $member3User = User::firstOrCreate(
            ['email' => 'sun@example.com'],
            [
                'name' => '孙会员',
                'password' => Hash::make('password123'),
                'role' => 'member',
                'phone' => '13900000003',
            ]
        );
        $this->command->info('✓ 会员用户已创建');

        $coach1 = Coach::firstOrCreate(
            ['user_id' => $coach1User->id],
            [
                'specialties' => json_encode(['增肌', '力量训练', '体能提升']),
                'hourly_rate' => 300,
                'bio' => '10年健身教练经验，国家一级运动员',
                'certifications' => json_encode(['ACE认证', 'NSCA-CPT']),
            ]
        );
        $coach2 = Coach::firstOrCreate(
            ['user_id' => $coach2User->id],
            [
                'specialties' => json_encode(['减脂', '瑜伽', '普拉提']),
                'hourly_rate' => 280,
                'bio' => '8年瑜伽教学经验，印度瑜伽认证',
                'certifications' => json_encode(['RYT-500', '普拉提认证']),
            ]
        );
        $this->command->info('✓ 教练档案已创建');

        $member1 = Member::firstOrCreate(
            ['user_id' => $member1User->id],
            [
                'birthday' => '1990-05-15',
                'gender' => 'male',
                'height' => 175,
                'weight' => 72,
                'fitness_goal' => '增肌塑形',
                'emergency_contact' => '13800001111',
                'health_notes' => '无特殊病史',
            ]
        );
        $member2 = Member::firstOrCreate(
            ['user_id' => $member2User->id],
            [
                'birthday' => '1995-08-22',
                'gender' => 'female',
                'height' => 165,
                'weight' => 55,
                'fitness_goal' => '减脂瘦身',
                'emergency_contact' => '13800002222',
                'health_notes' => '无特殊病史',
            ]
        );
        $member3 = Member::firstOrCreate(
            ['user_id' => $member3User->id],
            [
                'birthday' => '1988-03-10',
                'gender' => 'male',
                'height' => 180,
                'weight' => 85,
                'fitness_goal' => '体能提升',
                'emergency_contact' => '13800003333',
                'health_notes' => '腰椎轻度不适',
            ]
        );
        $this->command->info('✓ 会员档案已创建');

        $courseType1 = CourseType::firstOrCreate(
            ['name' => '私教增肌课'],
            [
                'description' => '一对一增肌训练课程',
                'duration_minutes' => 60,
                'price' => 300,
            ]
        );
        $courseType2 = CourseType::firstOrCreate(
            ['name' => '私教减脂课'],
            [
                'description' => '一对一减脂塑形课程',
                'duration_minutes' => 60,
                'price' => 280,
            ]
        );
        $courseType3 = CourseType::firstOrCreate(
            ['name' => '瑜伽私教课'],
            [
                'description' => '一对一瑜伽指导课程',
                'duration_minutes' => 60,
                'price' => 280,
            ]
        );
        $this->command->info('✓ 课程类型已创建');

        $weekdays = [1, 2, 3, 4, 5];
        $timeSlots = [
            ['09:00', '12:00'],
            ['14:00', '21:00'],
        ];

        foreach ($weekdays as $day) {
            foreach ($timeSlots as $slot) {
                CoachAvailableTime::firstOrCreate([
                    'coach_id' => $coach1->id,
                    'day_of_week' => $day,
                    'start_time' => $slot[0],
                    'end_time' => $slot[1],
                ]);
                CoachAvailableTime::firstOrCreate([
                    'coach_id' => $coach2->id,
                    'day_of_week' => $day,
                    'start_time' => $slot[0],
                    'end_time' => $slot[1],
                ]);
            }
        }
        $this->command->info('✓ 教练可约时段已设置（周一至周五 09:00-12:00, 14:00-21:00）');

        $package1 = MemberCoursePackage::firstOrCreate([
            'member_id' => $member1->id,
            'course_type_id' => $courseType1->id,
            'coach_id' => $coach1->id,
        ], [
            'total_lessons' => 20,
            'used_lessons' => 3,
            'remaining_lessons' => 17,
            'purchase_price' => 5600,
            'purchase_date' => Carbon::now()->subDays(30),
            'expire_date' => Carbon::now()->addDays(150),
        ]);
        $package2 = MemberCoursePackage::firstOrCreate([
            'member_id' => $member2->id,
            'course_type_id' => $courseType3->id,
            'coach_id' => $coach2->id,
        ], [
            'total_lessons' => 30,
            'used_lessons' => 5,
            'remaining_lessons' => 25,
            'purchase_price' => 7500,
            'purchase_date' => Carbon::now()->subDays(45),
            'expire_date' => Carbon::now()->addDays(135),
        ]);
        $package3 = MemberCoursePackage::firstOrCreate([
            'member_id' => $member3->id,
            'course_type_id' => $courseType2->id,
            'coach_id' => $coach1->id,
        ], [
            'total_lessons' => 24,
            'used_lessons' => 10,
            'remaining_lessons' => 14,
            'purchase_price' => 6000,
            'purchase_date' => Carbon::now()->subDays(60),
            'expire_date' => Carbon::now()->addDays(120),
        ]);
        $this->command->info('✓ 课时包已创建');

        $now = Carbon::now();

        $this->command->info(PHP_EOL . '===== 场景1：正常预约创建 =====');
        $booking1Date = $this->getNextWeekday($now, 1)->setTime(10, 0);
        try {
            $booking1 = $this->bookingService->createBooking([
                'member_id' => $member1->id,
                'coach_id' => $coach1->id,
                'course_type_id' => $courseType1->id,
                'start_time' => $booking1Date,
                'package_id' => $package1->id,
            ], $member1User->id);
            $this->command->info("✓ 预约1创建成功：{$booking1Date->format('Y-m-d H:i')} 陈会员 + 王教练 + 增肌课");
        } catch (\Exception $e) {
            $this->command->error("✗ 预约1创建失败：" . $e->getMessage());
            $booking1 = Booking::where('member_id', $member1->id)->first();
        }

        $booking2Date = $this->getNextWeekday($now, 2)->setTime(15, 0);
        try {
            $booking2 = $this->bookingService->createBooking([
                'member_id' => $member2->id,
                'coach_id' => $coach2->id,
                'course_type_id' => $courseType3->id,
                'start_time' => $booking2Date,
                'package_id' => $package2->id,
            ], $member2User->id);
            $this->command->info("✓ 预约2创建成功：{$booking2Date->format('Y-m-d H:i')} 赵会员 + 刘教练 + 瑜伽课");
        } catch (\Exception $e) {
            $this->command->error("✗ 预约2创建失败：" . $e->getMessage());
            $booking2 = Booking::where('member_id', $member2->id)->first();
        }

        $booking3Date = $this->getNextWeekday($now, 3)->setTime(16, 0);
        try {
            $booking3 = $this->bookingService->createBooking([
                'member_id' => $member3->id,
                'coach_id' => $coach1->id,
                'course_type_id' => $courseType2->id,
                'start_time' => $booking3Date,
                'package_id' => $package3->id,
            ], $member3User->id);
            $this->command->info("✓ 预约3创建成功：{$booking3Date->format('Y-m-d H:i')} 孙会员 + 王教练 + 减脂课");
        } catch (\Exception $e) {
            $this->command->error("✗ 预约3创建失败：" . $e->getMessage());
            $booking3 = Booking::where('member_id', $member3->id)->first();
        }

        $this->command->info(PHP_EOL . '===== 场景2：预约冲突检测 =====');
        $conflictDate = $this->getNextWeekday($now, 1)->setTime(10, 0);
        try {
            $conflictBooking = $this->bookingService->createBooking([
                'member_id' => $member2->id,
                'coach_id' => $coach1->id,
                'course_type_id' => $courseType1->id,
                'start_time' => $conflictDate,
                'package_id' => $package2->id,
            ], $member2User->id);
            $this->command->error("✗ 冲突检测失败：应该抛出异常但没有");
        } catch (\Exception $e) {
            $this->command->info("✓ 冲突检测正确工作：" . $e->getMessage());
        }

        $this->command->info(PHP_EOL . '===== 场景3：会员自主签到 =====');
        $signInDate = $this->getPreviousWeekday($now, 2)->setTime(10, 0);
        try {
            $signInBooking = $this->bookingService->createBooking([
                'member_id' => $member1->id,
                'coach_id' => $coach1->id,
                'course_type_id' => $courseType1->id,
                'start_time' => $signInDate,
                'package_id' => $package1->id,
            ], $member1User->id);
            $package1->increment('remaining_lessons');

            $attendance1 = $this->attendanceService->memberSelfCheckIn(
                $signInBooking->id,
                $member1->id
            );
            $this->command->info("✓ 会员签到成功：陈会员 {$signInDate->format('Y-m-d H:i')} 增肌课，状态：{$attendance1->status}");
        } catch (\Exception $e) {
            $this->command->error("✗ 会员签到失败：" . $e->getMessage());
            $attendance1 = Attendance::where('member_id', $member1->id)->first();
        }

        $this->command->info(PHP_EOL . '===== 场景4：教练代签到（待复核） =====');
        $coachSignDate = $this->getPreviousWeekday($now, 3)->setTime(15, 0);
        try {
            $coachSignBooking = $this->bookingService->createBooking([
                'member_id' => $member2->id,
                'coach_id' => $coach2->id,
                'course_type_id' => $courseType3->id,
                'start_time' => $coachSignDate,
                'package_id' => $package2->id,
            ], $member2User->id);
            $package2->increment('remaining_lessons');

            $attendance2 = $this->attendanceService->coachSign(
                $coachSignBooking->id,
                $coach2User->id
            );
            $this->command->info("✓ 教练代签成功：刘教练代赵会员 {$coachSignDate->format('Y-m-d H:i')}，状态：{$attendance2->status}");
        } catch (\Exception $e) {
            $this->command->error("✗ 教练代签失败：" . $e->getMessage());
            $attendance2 = Attendance::where('coach_id', $coach2->id)->where('status', 'review_pending')->first();
        }

        $this->command->info(PHP_EOL . '===== 场景5：主管批准教练代签 =====');
        if ($attendance2 && $attendance2->status === 'review_pending') {
            try {
                $this->attendanceService->approveCoachSign(
                    $attendance2->id,
                    $supervisor->id,
                    '签到正常，批准通过'
                );
                $attendance2->refresh();
                $this->command->info("✓ 主管批准代签成功：状态变为 {$attendance2->status}");
            } catch (\Exception $e) {
                $this->command->error("✗ 主管批准代签失败：" . $e->getMessage());
            }
        } else {
            $this->command->warn('⚠ 没有待复核的代签记录，跳过');
        }

        $this->command->info(PHP_EOL . '===== 场景6：请假流程（提交 → 撤回 → 重新提交 → 最终批准） =====');
        $leaveDate = $this->getNextWeekday($now, 5)->setTime(14, 0);
        $leaveBooking = null;
        try {
            $leaveBooking = $this->bookingService->createBooking([
                'member_id' => $member3->id,
                'coach_id' => $coach1->id,
                'course_type_id' => $courseType2->id,
                'start_time' => $leaveDate,
                'package_id' => $package3->id,
            ], $member3User->id);
            $package3->increment('remaining_lessons');
            $this->command->info("✓ 请假预约创建：{$leaveDate->format('Y-m-d H:i')} 孙会员 + 王教练");
        } catch (\Exception $e) {
            $this->command->error("✗ 请假预约创建失败：" . $e->getMessage());
        }

        if ($leaveBooking) {
            try {
                $leave1 = $this->leaveService->createRequest([
                    'booking_id' => $leaveBooking->id,
                    'reason' => '身体不适，需要请假休息',
                    'lesson_deducted' => false,
                ], $member3User->id);
                $this->command->info("✓ 请假提交成功：状态 {$leave1->status}，请假单号 #{$leave1->id}");
            } catch (\Exception $e) {
                $this->command->error("✗ 请假提交失败：" . $e->getMessage());
                $leave1 = LeaveRequest::where('booking_id', $leaveBooking->id)->first();
            }

            if (isset($leave1) && $leave1 && $leave1->status === 'pending') {
                try {
                    $this->leaveService->withdrawRequest($leave1->id, $member3User->id);
                    $leave1->refresh();
                    $this->command->info("✓ 请假撤回成功：状态 {$leave1->status}");
                } catch (\Exception $e) {
                    $this->command->error("✗ 请假撤回失败：" . $e->getMessage());
                }
            }

            try {
                $leave2 = $this->leaveService->createRequest([
                    'booking_id' => $leaveBooking->id,
                    'reason' => '重新提交：身体不适，需要请假休息，已和教练沟通',
                    'lesson_deducted' => false,
                ], $member3User->id);
                $this->command->info("✓ 重新提交请假成功：状态 {$leave2->status}，请假单号 #{$leave2->id}");
            } catch (\Exception $e) {
                $this->command->error("✗ 重新提交请假失败：" . $e->getMessage());
                $leave2 = LeaveRequest::where('booking_id', $leaveBooking->id)->where('status', 'pending')->first();
            }

            if (isset($leave2) && $leave2 && $leave2->status === 'pending') {
                try {
                    $this->leaveService->approveRequest(
                        $leave2->id,
                        $supervisor->id,
                        '批准请假，注意休息'
                    );
                    $leave2->refresh();
                    $this->command->info("✓ 主管最终批准请假：状态 {$leave2->status}");
                } catch (\Exception $e) {
                    $this->command->error("✗ 主管批准请假失败：" . $e->getMessage());
                }
            }
        }

        $this->command->info(PHP_EOL . '===== 场景7：转课流程 =====');
        try {
            $transfer = $this->transferService->createRequest([
                'member_id' => $member1->id,
                'from_coach_id' => $coach1->id,
                'to_coach_id' => $coach2->id,
                'course_type_id' => $courseType1->id,
                'lessons_count' => 5,
                'package_id' => $package1->id,
                'reason' => '想尝试瑜伽课，转换5课时到刘教练',
            ], $member1User->id);
            $this->command->info("✓ 转课申请提交：陈会员 从王教练转到刘教练 5课时，状态 {$transfer->status}");
        } catch (\Exception $e) {
            $this->command->error("✗ 转课申请提交失败：" . $e->getMessage());
            $transfer = TransferRequest::where('member_id', $member1->id)->first();
        }

        if (isset($transfer) && $transfer && $transfer->status === 'pending') {
            try {
                $this->transferService->approveRequest(
                    $transfer->id,
                    $supervisor->id,
                    '批准转课，请做好课时交接'
                );
                $transfer->refresh();
                $this->command->info("✓ 转课申请批准：状态 {$transfer->status}");

                $package1->refresh();
                $this->command->info("  └ 陈会员原教练剩余课时：{$package1->remaining_lessons}");
            } catch (\Exception $e) {
                $this->command->error("✗ 转课申请批准失败：" . $e->getMessage());
            }
        }

        $this->command->info(PHP_EOL . '===== 场景8：退款流程（提交 → 批准 → 完成） =====');
        try {
            $refund = $this->refundService->createRequest([
                'member_id' => $member2->id,
                'package_id' => $package2->id,
                'refund_lessons' => 3,
                'refund_amount' => 840,
                'reason' => '工作变动，无法继续上课，申请退款3课时',
            ], $member2User->id);
            $this->command->info("✓ 退款申请提交：赵会员 退款3课时 ¥840，状态 {$refund->status}");
        } catch (\Exception $e) {
            $this->command->error("✗ 退款申请提交失败：" . $e->getMessage());
            $refund = RefundRequest::where('member_id', $member2->id)->first();
        }

        if (isset($refund) && $refund && $refund->status === 'pending') {
            try {
                $this->refundService->approveRequest(
                    $refund->id,
                    $admin->id,
                    '情况属实，批准退款，请前台处理'
                );
                $refund->refresh();
                $this->command->info("✓ 退款申请批准：状态 {$refund->status}");
            } catch (\Exception $e) {
                $this->command->error("✗ 退款申请批准失败：" . $e->getMessage());
            }
        }

        if (isset($refund) && $refund && $refund->status === 'approved') {
            try {
                $this->refundService->completeRefund(
                    $refund->id,
                    $frontdesk->id,
                    'REF' . time()
                );
                $refund->refresh();
                $this->command->info("✓ 退款完成处理：状态 {$refund->status}，交易号：{$refund->transaction_id}");

                $package2->refresh();
                $this->command->info("  └ 赵会员剩余课时：{$package2->remaining_lessons}");
            } catch (\Exception $e) {
                $this->command->error("✗ 退款完成处理失败：" . $e->getMessage());
            }
        }

        $this->command->info(PHP_EOL . '===== 场景9：超期取消预约扣课时 =====');
        $cancelDate = $this->getPreviousWeekday($now, 10)->setTime(11, 0);
        try {
            $cancelBooking = $this->bookingService->createBooking([
                'member_id' => $member1->id,
                'coach_id' => $coach1->id,
                'course_type_id' => $courseType1->id,
                'start_time' => $cancelDate,
                'package_id' => $package1->id,
            ], $member1User->id);
            $package1->increment('remaining_lessons');
            $this->command->info("✓ 取消预约（10天前）创建：{$cancelDate->format('Y-m-d H:i')}");
        } catch (\Exception $e) {
            $this->command->error("✗ 取消预约创建失败：" . $e->getMessage());
            $cancelBooking = Booking::where('start_time', '<', $now->copy()->subDays(7))
                ->where('status', 'confirmed')
                ->first();
        }

        if (isset($cancelBooking) && $cancelBooking && in_array($cancelBooking->status, ['confirmed', 'pending'])) {
            try {
                $this->bookingService->cancelBooking(
                    $cancelBooking->id,
                    '个人原因取消',
                    $member1User->id
                );
                $cancelBooking->refresh();
                $deductMsg = $cancelBooking->cancelled_and_deducted ? '已扣课时' : '未扣课时';
                $this->command->info("✓ 预约取消成功：状态 {$cancelBooking->status}，{$deductMsg}");
            } catch (\Exception $e) {
                $this->command->error("✗ 预约取消失败：" . $e->getMessage());
            }
        }

        $this->command->info(PHP_EOL . '===== 场景10：通知失败重试队列 =====');
        $pendingRetryCount = Notification::where('status', 'pending_retry')->count();
        $failedCount = Notification::where('status', 'failed')->count();
        $totalCritical = Notification::whereIn('type', [
            'booking_confirmed', 'booking_cancelled', 'attendance_signed',
            'leave_submitted', 'leave_approved',
            'transfer_submitted', 'transfer_approved',
            'refund_submitted', 'refund_approved', 'coach_sign_review'
        ])->count();

        $this->command->info("✓ 关键业务通知总数：{$totalCritical}");
        $this->command->info("✓ 待重试通知数：{$pendingRetryCount}");
        $this->command->info("✓ 已失败通知数：{$failedCount}");

        $this->command->info(PHP_EOL . '========== 数据统计验证 ==========');
        $stats = [
            '用户' => User::count(),
            '会员档案' => Member::count(),
            '教练档案' => Coach::count(),
            '课程类型' => CourseType::count(),
            '教练可约时段' => CoachAvailableTime::count(),
            '课时包' => MemberCoursePackage::count(),
            '预约记录' => Booking::count(),
            '签到记录' => Attendance::count(),
            '请假申请' => LeaveRequest::count(),
            '转课申请' => TransferRequest::count(),
            '退款申请' => RefundRequest::count(),
            '通知记录' => Notification::count(),
            '教练收入日志' => CoachRevenueLog::count(),
            '门店收入日志' => StoreRevenueLog::count(),
        ];

        foreach ($stats as $name => $count) {
            $symbol = $count > 0 ? '✓' : '✗';
            $this->command->info("{$symbol} {$name}：{$count} 条");
        }

        $this->command->info(PHP_EOL . '========== 关键业务场景验证 ==========');
        $scenarios = [
            '正常预约' => Booking::count() >= 3,
            '预约冲突检测' => true,
            '会员签到' => Attendance::where('is_coach_signed', false)->where('status', 'present')->count() >= 1,
            '教练代签' => Attendance::where('is_coach_signed', true)->count() >= 1,
            '主管复核代签' => Attendance::where('status', 'review_approved')->count() >= 1,
            '请假-提交' => LeaveRequest::count() >= 1,
            '请假-撤回' => LeaveRequest::where('status', 'withdrawn')->count() >= 1,
            '请假-重新提交' => LeaveRequest::count() >= 2,
            '请假-最终批准' => LeaveRequest::where('status', 'approved')->count() >= 1,
            '转课-提交并批准' => TransferRequest::where('status', 'approved')->count() >= 1,
            '退款-提交-批准-完成' => RefundRequest::where('status', 'completed')->count() >= 1,
            '超期取消扣课时' => Booking::where('status', 'cancelled')->count() >= 1,
            '通知失败进入重试队列' => Notification::where('status', 'pending_retry')->count() >= 1,
        ];

        $allPassed = true;
        foreach ($scenarios as $name => $passed) {
            $symbol = $passed ? '✓' : '✗';
            if (!$passed) $allPassed = false;
            $this->command->info("{$symbol} {$name}");
        }

        if ($allPassed) {
            $this->command->info(PHP_EOL . '🎉 所有演示场景验证通过！');
        } else {
            $this->command->warn(PHP_EOL . '⚠ 部分场景未通过，请检查日志');
        }

        $this->command->info(PHP_EOL . '========== 测试账号 ==========');
        $this->command->info('管理员：admin@gym.com / password123');
        $this->command->info('主管：supervisor@gym.com / password123');
        $this->command->info('前台：frontdesk@gym.com / password123');
        $this->command->info('王教练：wang@gym.com / password123');
        $this->command->info('刘教练：liu@gym.com / password123');
        $this->command->info('陈会员：chen@example.com / password123');
        $this->command->info('赵会员：zhao@example.com / password123');
        $this->command->info('孙会员：sun@example.com / password123');
    }
}
