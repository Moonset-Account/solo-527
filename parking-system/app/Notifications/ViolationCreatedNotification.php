<?php

namespace App\Notifications;

use App\Models\ParkingViolation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ViolationCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public ParkingViolation $violation) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('违停记录通知')
            ->line("违停编号: {$this->violation->violation_no}")
            ->line("车牌: {$this->violation->license_plate}")
            ->line("时间: {$this->violation->violation_time->format('Y-m-d H:i')}")
            ->line("类型: {$this->getViolationTypeText()}")
            ->line("罚款金额: ¥{$this->violation->fine_amount}")
            ->action('查看详情', url("/violations/{$this->violation->id}"));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'violation_id' => $this->violation->id,
            'violation_no' => $this->violation->violation_no,
            'license_plate' => $this->violation->license_plate,
            'violation_time' => $this->violation->violation_time,
            'type' => $this->violation->type,
            'fine_amount' => $this->violation->fine_amount,
            'notification_type' => 'violation_created',
        ];
    }

    protected function getViolationTypeText(): string
    {
        $types = [
            'no_booking' => '无预约停车',
            'overtime' => '超时停车',
            'wrong_spot' => '车位错误',
            'unauthorized' => '未授权车辆',
        ];
        return $types[$this->violation->type] ?? '其他违停';
    }
}
