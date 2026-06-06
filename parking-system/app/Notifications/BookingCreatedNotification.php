<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Booking $booking, public string $targetUser = 'visitor') {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $subject = $this->targetUser === 'owner'
            ? '您的车位有新的预约'
            : '预约成功通知';

        return (new MailMessage)
            ->subject($subject)
            ->line("订单号: {$this->booking->booking_no}")
            ->line("车位: {$this->booking->spot->spot_number}")
            ->line("车牌: {$this->booking->license_plate}")
            ->line("时间: {$this->booking->start_time->format('Y-m-d H:i')} - {$this->booking->end_time->format('Y-m-d H:i')}")
            ->line("金额: ¥{$this->booking->total_amount}")
            ->action('查看详情', url("/bookings/{$this->booking->id}"));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'booking_id' => $this->booking->id,
            'booking_no' => $this->booking->booking_no,
            'spot_number' => $this->booking->spot->spot_number,
            'license_plate' => $this->booking->license_plate,
            'start_time' => $this->booking->start_time,
            'end_time' => $this->booking->end_time,
            'total_amount' => $this->booking->total_amount,
            'target_user' => $this->targetUser,
            'type' => 'booking_created',
        ];
    }
}
