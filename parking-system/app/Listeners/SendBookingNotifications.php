<?php

namespace App\Listeners;

use App\Events\BookingCreated;
use App\Notifications\BookingCreatedNotification;
use Illuminate\Support\Facades\Log;

class SendBookingNotifications
{
    public function handle(BookingCreated $event): void
    {
        $booking = $event->booking;

        try {
            if ($booking->visitor) {
                $booking->visitor->notify(new BookingCreatedNotification($booking, 'visitor'));
            }

            if ($booking->spot && $booking->spot->owner) {
                $booking->spot->owner->notify(new BookingCreatedNotification($booking, 'owner'));
            }
        } catch (\Exception $e) {
            Log::error('发送预约通知失败', [
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
