<?php

namespace App\Services;

use App\Enums\NotificationType;
use App\Enums\NotificationChannel;
use App\Models\Notification;
use App\Models\Booking;
use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\TransferRequest;
use App\Models\RefundRequest;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    protected $failDemoMode;

    protected $criticalNotificationTypes = [
        'booking_confirmed',
        'booking_cancelled',
        'booking_reminder',
        'attendance_signed',
        'leave_submitted',
        'leave_approved',
        'leave_rejected',
        'transfer_submitted',
        'transfer_approved',
        'transfer_rejected',
        'refund_submitted',
        'refund_approved',
        'refund_rejected',
        'coach_sign_review',
    ];

    public function __construct()
    {
        $this->failDemoMode = env('NOTIFICATION_FAIL_DEMO', false);
    }

    protected function getChannelForType($type)
    {
        $typeValue = is_string($type) ? $type : $type->value;
        if (in_array($typeValue, $this->criticalNotificationTypes)) {
            if ($this->failDemoMode) {
                return NotificationChannel::SMS;
            }
            return NotificationChannel::SMS;
        }
        return NotificationChannel::SYSTEM;
    }

    protected function shouldFailForDemo($channel, $type)
    {
        if (!$this->failDemoMode) {
            return false;
        }

        if ($channel === NotificationChannel::SYSTEM->value) {
            return false;
        }

        $typeValue = is_string($type) ? $type : $type->value;
        if (in_array($typeValue, $this->criticalNotificationTypes)) {
            return true;
        }

        return false;
    }

    public function sendBookingConfirmation(Booking $booking)
    {
        $memberUser = $booking->member->user;
        $coachUser = $booking->coach->user;
        $type = NotificationType::BOOKING_CONFIRMED;
        $channel = $this->getChannelForType($type);

        $this->createNotification(
            $memberUser->id,
            $type,
            $channel,
            '预约成功',
            "您的课程预约已确认：{$booking->courseType->name}，时间：{$booking->start_time->format('Y-m-d H:i')}，教练：{$booking->coach->user->name}",
            [
                'booking_id' => $booking->id,
                'course_name' => $booking->courseType->name,
                'start_time' => $booking->start_time->toISOString(),
                'coach_name' => $booking->coach->user->name,
            ],
            $booking->id,
            $booking->member_id,
            $booking->coach_id
        );

        $this->createNotification(
            $coachUser->id,
            $type,
            $channel,
            '新的课程预约',
            "您有新的课程预约：{$booking->courseType->name}，时间：{$booking->start_time->format('Y-m-d H:i')}，会员：{$booking->member->user->name}",
            [
                'booking_id' => $booking->id,
                'course_name' => $booking->courseType->name,
                'start_time' => $booking->start_time->toISOString(),
                'member_name' => $booking->member->user->name,
            ],
            $booking->id,
            $booking->member_id,
            $booking->coach_id
        );
    }

    public function sendBookingCancellation(Booking $booking, $reason)
    {
        $memberUser = $booking->member->user;
        $coachUser = $booking->coach->user;
        $type = NotificationType::BOOKING_CANCELLED;
        $channel = $this->getChannelForType($type);

        $deductMsg = $booking->willDeductLessonOnCancel() ? '（已扣除课时）' : '（未扣除课时）';

        $this->createNotification(
            $memberUser->id,
            $type,
            $channel,
            '预约已取消',
            "您的课程预约已取消：{$booking->courseType->name}，原时间：{$booking->start_time->format('Y-m-d H:i')}。原因：{$reason} {$deductMsg}",
            [
                'booking_id' => $booking->id,
                'reason' => $reason,
                'deduct_lesson' => $booking->willDeductLessonOnCancel(),
            ],
            $booking->id,
            $booking->member_id,
            $booking->coach_id
        );

        $this->createNotification(
            $coachUser->id,
            $type,
            $channel,
            '课程预约已取消',
            "课程预约已取消：{$booking->courseType->name}，原时间：{$booking->start_time->format('Y-m-d H:i')}，会员：{$booking->member->user->name}。原因：{$reason}",
            [
                'booking_id' => $booking->id,
                'reason' => $reason,
            ],
            $booking->id,
            $booking->member_id,
            $booking->coach_id
        );
    }

    public function sendBookingReschedule(Booking $oldBooking, Booking $newBooking)
    {
        $memberUser = $newBooking->member->user;
        $coachUser = $newBooking->coach->user;
        $type = NotificationType::BOOKING_CONFIRMED;
        $channel = $this->getChannelForType($type);

        $this->createNotification(
            $memberUser->id,
            $type,
            $channel,
            '预约改期成功',
            "您的课程已改期：{$newBooking->courseType->name}，新时间：{$newBooking->start_time->format('Y-m-d H:i')}，教练：{$newBooking->coach->user->name}",
            [
                'old_booking_id' => $oldBooking->id,
                'new_booking_id' => $newBooking->id,
                'old_start_time' => $oldBooking->start_time->toISOString(),
                'new_start_time' => $newBooking->start_time->toISOString(),
            ],
            $newBooking->id,
            $newBooking->member_id,
            $newBooking->coach_id
        );

        $this->createNotification(
            $coachUser->id,
            $type,
            $channel,
            '课程改期通知',
            "课程已改期：{$newBooking->courseType->name}，原时间：{$oldBooking->start_time->format('Y-m-d H:i')}，新时间：{$newBooking->start_time->format('Y-m-d H:i')}，会员：{$newBooking->member->user->name}",
            [
                'old_booking_id' => $oldBooking->id,
                'new_booking_id' => $newBooking->id,
            ],
            $newBooking->id,
            $newBooking->member_id,
            $newBooking->coach_id
        );
    }

    public function sendAttendanceCompleted(Attendance $attendance)
    {
        $memberUser = $attendance->member->user;
        $type = NotificationType::ATTENDANCE_SIGNED;
        $channel = $this->getChannelForType($type);

        $this->createNotification(
            $memberUser->id,
            $type,
            $channel,
            '签到成功',
            "您已成功签到：{$attendance->booking->courseType->name}，课时已扣除",
            [
                'attendance_id' => $attendance->id,
                'booking_id' => $attendance->booking_id,
            ],
            $attendance->booking_id,
            $attendance->member_id,
            $attendance->coach_id
        );
    }

    public function sendCoachSignReviewNotification(Attendance $attendance)
    {
        $supervisors = \App\Models\User::where('role', 'supervisor')->get();
        $type = NotificationType::COACH_SIGN_REVIEW;
        $channel = $this->getChannelForType($type);

        foreach ($supervisors as $supervisor) {
            $this->createNotification(
                $supervisor->id,
                $type,
                $channel,
                '教练代签待复核',
                "教练{$attendance->coach->user->name}代会员{$attendance->member->user->name}签到，需要复核。课程：{$attendance->booking->courseType->name}",
                [
                    'attendance_id' => $attendance->id,
                    'booking_id' => $attendance->booking_id,
                    'coach_name' => $attendance->coach->user->name,
                    'member_name' => $attendance->member->user->name,
                ],
                $attendance->booking_id,
                $attendance->member_id,
                $attendance->coach_id
            );
        }
    }

    public function sendCoachSignApproved(Attendance $attendance)
    {
        $coachUser = $attendance->coach->user;
        $type = NotificationType::ATTENDANCE_SIGNED;
        $channel = $this->getChannelForType($type);

        $this->createNotification(
            $coachUser->id,
            $type,
            $channel,
            '代签已通过复核',
            "您代签的签到已通过复核：会员{$attendance->member->user->name}，课程：{$attendance->booking->courseType->name}",
            [
                'attendance_id' => $attendance->id,
            ],
            $attendance->booking_id,
            $attendance->member_id,
            $attendance->coach_id
        );
    }

    public function sendCoachSignRejected(Attendance $attendance)
    {
        $coachUser = $attendance->coach->user;
        $type = NotificationType::ATTENDANCE_SIGNED;
        $channel = $this->getChannelForType($type);

        $this->createNotification(
            $coachUser->id,
            $type,
            $channel,
            '代签未通过复核',
            "您代签的签到未通过复核：会员{$attendance->member->user->name}，课程：{$attendance->booking->courseType->name}。原因：{$attendance->review_notes}",
            [
                'attendance_id' => $attendance->id,
                'review_notes' => $attendance->review_notes,
            ],
            $attendance->booking_id,
            $attendance->member_id,
            $attendance->coach_id
        );
    }

    public function sendLeaveSubmitted(LeaveRequest $leaveRequest)
    {
        $frontdesks = \App\Models\User::where('role', 'frontdesk')->get();
        $supervisors = \App\Models\User::where('role', 'supervisor')->get();
        $recipients = $frontdesks->merge($supervisors);
        $type = NotificationType::LEAVE_SUBMITTED;
        $channel = $this->getChannelForType($type);

        foreach ($recipients as $recipient) {
            $this->createNotification(
                $recipient->id,
                $type,
                $channel,
                '新的请假申请',
                "会员{$leaveRequest->member->user->name}提交请假申请，课程：{$leaveRequest->booking->courseType->name}，时间：{$leaveRequest->booking->start_time->format('Y-m-d H:i')}",
                [
                    'leave_request_id' => $leaveRequest->id,
                    'booking_id' => $leaveRequest->booking_id,
                ],
                $leaveRequest->booking_id,
                $leaveRequest->member_id
            );
        }
    }

    public function sendLeaveApproved(LeaveRequest $leaveRequest)
    {
        $memberUser = $leaveRequest->member->user;
        $type = NotificationType::LEAVE_APPROVED;
        $channel = $this->getChannelForType($type);

        $deductMsg = $leaveRequest->lesson_deducted ? '（已扣除课时）' : '（未扣除课时）';

        $this->createNotification(
            $memberUser->id,
            $type,
            $channel,
            '请假已批准',
            "您的请假申请已批准{$deductMsg}。课程：{$leaveRequest->booking->courseType->name}，时间：{$leaveRequest->booking->start_time->format('Y-m-d H:i')}",
            [
                'leave_request_id' => $leaveRequest->id,
                'deduct_lesson' => $leaveRequest->lesson_deducted,
            ],
            $leaveRequest->booking_id,
            $leaveRequest->member_id
        );
    }

    public function sendLeaveRejected(LeaveRequest $leaveRequest)
    {
        $memberUser = $leaveRequest->member->user;
        $type = NotificationType::LEAVE_REJECTED;
        $channel = $this->getChannelForType($type);

        $this->createNotification(
            $memberUser->id,
            $type,
            $channel,
            '请假未批准',
            "您的请假申请未批准。原因：{$leaveRequest->review_notes}。课程：{$leaveRequest->booking->courseType->name}",
            [
                'leave_request_id' => $leaveRequest->id,
                'review_notes' => $leaveRequest->review_notes,
            ],
            $leaveRequest->booking_id,
            $leaveRequest->member_id
        );
    }

    public function sendTransferSubmitted(TransferRequest $transferRequest)
    {
        $frontdesks = \App\Models\User::where('role', 'frontdesk')->get();
        $supervisors = \App\Models\User::where('role', 'supervisor')->get();
        $recipients = $frontdesks->merge($supervisors);
        $type = NotificationType::TRANSFER_SUBMITTED;
        $channel = $this->getChannelForType($type);

        foreach ($recipients as $recipient) {
            $this->createNotification(
                $recipient->id,
                $type,
                $channel,
                '新的转课申请',
                "会员{$transferRequest->member->user->name}提交转课申请，从教练{$transferRequest->fromCoach->user->name}转到教练{$transferRequest->toCoach->user->name}，共{$transferRequest->lessons_count}课时",
                [
                    'transfer_request_id' => $transferRequest->id,
                ],
                null,
                $transferRequest->member_id,
                $transferRequest->to_coach_id
            );
        }
    }

    public function sendTransferApproved(TransferRequest $transferRequest)
    {
        $memberUser = $transferRequest->member->user;
        $fromCoachUser = $transferRequest->fromCoach->user;
        $toCoachUser = $transferRequest->toCoach->user;
        $type = NotificationType::TRANSFER_APPROVED;
        $channel = $this->getChannelForType($type);

        $this->createNotification(
            $memberUser->id,
            $type,
            $channel,
            '转课已批准',
            "您的转课申请已批准。从教练{$transferRequest->fromCoach->user->name}转到教练{$transferRequest->toCoach->user->name}，共{$transferRequest->lessons_count}课时",
            ['transfer_request_id' => $transferRequest->id],
            null,
            $transferRequest->member_id
        );

        $this->createNotification(
            $fromCoachUser->id,
            $type,
            $channel,
            '学员转出',
            "学员{$transferRequest->member->user->name}的{$transferRequest->lessons_count}课时已转出到教练{$transferRequest->toCoach->user->name}",
            ['transfer_request_id' => $transferRequest->id],
            null,
            $transferRequest->member_id,
            $transferRequest->from_coach_id
        );

        $this->createNotification(
            $toCoachUser->id,
            $type,
            $channel,
            '学员转入',
            "学员{$transferRequest->member->user->name}的{$transferRequest->lessons_count}课时已转入到您名下",
            ['transfer_request_id' => $transferRequest->id],
            null,
            $transferRequest->member_id,
            $transferRequest->to_coach_id
        );
    }

    public function sendTransferRejected(TransferRequest $transferRequest)
    {
        $memberUser = $transferRequest->member->user;
        $type = NotificationType::TRANSFER_REJECTED;
        $channel = $this->getChannelForType($type);

        $this->createNotification(
            $memberUser->id,
            $type,
            $channel,
            '转课未批准',
            "您的转课申请未批准。原因：{$transferRequest->review_notes}",
            [
                'transfer_request_id' => $transferRequest->id,
                'review_notes' => $transferRequest->review_notes,
            ],
            null,
            $transferRequest->member_id
        );
    }

    public function sendRefundSubmitted(RefundRequest $refundRequest)
    {
        $supervisors = \App\Models\User::where('role', 'supervisor')->get();
        $admins = \App\Models\User::where('role', 'admin')->get();
        $recipients = $supervisors->merge($admins);
        $type = NotificationType::REFUND_SUBMITTED;
        $channel = $this->getChannelForType($type);

        foreach ($recipients as $recipient) {
            $this->createNotification(
                $recipient->id,
                $type,
                $channel,
                '新的退款申请',
                "会员{$refundRequest->member->user->name}提交退款申请，退款{$refundRequest->refund_lessons}课时，金额：¥{$refundRequest->refund_amount}",
                ['refund_request_id' => $refundRequest->id],
                null,
                $refundRequest->member_id
            );
        }
    }

    public function sendRefundApproved(RefundRequest $refundRequest)
    {
        $memberUser = $refundRequest->member->user;
        $frontdesks = \App\Models\User::where('role', 'frontdesk')->get();
        $type = NotificationType::REFUND_APPROVED;
        $channel = $this->getChannelForType($type);

        $this->createNotification(
            $memberUser->id,
            $type,
            $channel,
            '退款申请已批准',
            "您的退款申请已批准。退款{$refundRequest->refund_lessons}课时，金额：¥{$refundRequest->refund_amount}，将尽快处理",
            ['refund_request_id' => $refundRequest->id],
            null,
            $refundRequest->member_id
        );

        foreach ($frontdesks as $frontdesk) {
            $this->createNotification(
                $frontdesk->id,
                $type,
                $channel,
                '退款待处理',
                "退款申请已批准，待前台处理。会员：{$refundRequest->member->user->name}，金额：¥{$refundRequest->refund_amount}",
                ['refund_request_id' => $refundRequest->id],
                null,
                $refundRequest->member_id
            );
        }
    }

    public function sendRefundRejected(RefundRequest $refundRequest)
    {
        $memberUser = $refundRequest->member->user;
        $type = NotificationType::REFUND_REJECTED;
        $channel = $this->getChannelForType($type);

        $this->createNotification(
            $memberUser->id,
            $type,
            $channel,
            '退款申请未批准',
            "您的退款申请未批准。原因：{$refundRequest->review_notes}",
            [
                'refund_request_id' => $refundRequest->id,
                'review_notes' => $refundRequest->review_notes,
            ],
            null,
            $refundRequest->member_id
        );
    }

    public function sendRefundCompleted(RefundRequest $refundRequest)
    {
        $memberUser = $refundRequest->member->user;
        $type = NotificationType::REFUND_APPROVED;
        $channel = $this->getChannelForType($type);

        $this->createNotification(
            $memberUser->id,
            $type,
            $channel,
            '退款已完成',
            "您的退款已完成。退款{$refundRequest->refund_lessons}课时，金额：¥{$refundRequest->refund_amount}",
            ['refund_request_id' => $refundRequest->id],
            null,
            $refundRequest->member_id
        );
    }

    protected function createNotification(
        $userId,
        $type,
        $channel,
        $title,
        $content,
        $data = [],
        $relatedBookingId = null,
        $relatedMemberId = null,
        $relatedCoachId = null
    ) {
        $typeValue = is_string($type) ? $type : $type->value;
        $channelValue = is_string($channel) ? $channel : $channel->value;

        $notification = Notification::create([
            'user_id' => $userId,
            'type' => $typeValue,
            'channel' => $channelValue,
            'title' => $title,
            'content' => $content,
            'data' => $data,
            'status' => 'pending',
            'retry_count' => 0,
            'max_retries' => 3,
            'related_booking_id' => $relatedBookingId,
            'related_member_id' => $relatedMemberId,
            'related_coach_id' => $relatedCoachId,
        ]);

        $this->dispatchNotification($notification);

        return $notification;
    }

    protected function dispatchNotification(Notification $notification)
    {
        try {
            $this->sendNotificationThroughChannel($notification);
            $notification->markAsSent();
        } catch (\Exception $e) {
            Log::error("Notification send failed: {$e->getMessage()}", [
                'notification_id' => $notification->id,
                'channel' => $notification->channel,
                'type' => $notification->type,
            ]);
            $notification->markAsFailed($e->getMessage());
        }
    }

    protected function sendNotificationThroughChannel(Notification $notification)
    {
        $channel = $notification->channel;
        $type = $notification->type;

        if ($this->shouldFailForDemo($channel, $type)) {
            $errorMessages = [
                NotificationChannel::SMS->value => '短信网关连接超时 - 演示模式确定性失败',
                NotificationChannel::EMAIL->value => '邮件服务器响应错误 - 演示模式确定性失败',
                NotificationChannel::WECHAT->value => '微信服务号API调用失败 - 演示模式确定性失败',
                NotificationChannel::APP_PUSH->value => '推送服务暂不可用 - 演示模式确定性失败',
            ];
            $errorMsg = $errorMessages[$channel] ?? '服务暂不可用 - 演示模式确定性失败';
            throw new \Exception($errorMsg);
        }

        switch ($channel) {
            case NotificationChannel::SYSTEM->value:
                return true;
            case NotificationChannel::SMS->value:
            case NotificationChannel::EMAIL->value:
            case NotificationChannel::WECHAT->value:
            case NotificationChannel::APP_PUSH->value:
            default:
                return true;
        }
    }

    public function retryFailedNotifications()
    {
        $notifications = Notification::pendingRetry()->get();
        $retryCount = 0;

        foreach ($notifications as $notification) {
            try {
                $notification->last_retry_at = now();
                $notification->save();

                $this->sendNotificationThroughChannel($notification);
                $notification->markAsSent();
                $retryCount++;
            } catch (\Exception $e) {
                $notification->markAsFailed($e->getMessage());
            }
        }

        return $retryCount;
    }

    public function getUserNotifications($userId, $limit = 20)
    {
        return Notification::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    public function getUnreadCount($userId)
    {
        return Notification::where('user_id', $userId)
            ->where('status', 'sent')
            ->whereNull('read_at')
            ->count();
    }

    public function getFailedNotifications()
    {
        return Notification::whereIn('status', ['pending_retry', 'failed'])
            ->with(['user', 'relatedBooking', 'relatedMember', 'relatedCoach'])
            ->orderBy('next_retry_at', 'asc')
            ->get();
    }
}
