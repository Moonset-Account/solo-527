<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\ParkingSpot;
use App\Models\BookingDailySplit;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class BookingService
{
    const LOCK_PREFIX = 'parking_booking_lock:';
    const LOCK_TTL = 300;
    const PLATFORM_FEE_RATE = 0.1;

    public function checkTimeConflict(int $spotId, Carbon $startTime, Carbon $endTime, ?int $excludeBookingId = null): bool
    {
        $query = Booking::where('spot_id', $spotId)
            ->whereNotIn('status', ['cancelled', 'refunded'])
            ->where(function ($q) use ($startTime, $endTime) {
                $q->where(function ($q2) use ($startTime, $endTime) {
                    $q2->where('start_time', '<', $endTime)
                        ->where('end_time', '>', $startTime);
                });
            });

        if ($excludeBookingId) {
            $query->where('id', '!=', $excludeBookingId);
        }

        return $query->exists();
    }

    public function getConflictingBookings(int $spotId, Carbon $startTime, Carbon $endTime, ?int $excludeBookingId = null)
    {
        $query = Booking::where('spot_id', $spotId)
            ->whereNotIn('status', ['cancelled', 'refunded'])
            ->where(function ($q) use ($startTime, $endTime) {
                $q->where(function ($q2) use ($startTime, $endTime) {
                    $q2->where('start_time', '<', $endTime)
                        ->where('end_time', '>', $startTime);
                });
            });

        if ($excludeBookingId) {
            $query->where('id', '!=', $excludeBookingId);
        }

        return $query->get();
    }

    public function lockSpot(int $spotId, Carbon $startTime, Carbon $endTime, int $visitorId): ?string
    {
        $lockKey = self::LOCK_PREFIX . "{$spotId}:{$startTime->timestamp}:{$endTime->timestamp}";
        $lockValue = Str::random(64);
        $lockExpire = time() + self::LOCK_TTL;

        $locked = Redis::set($lockKey, $lockValue, 'NX', 'EX', self::LOCK_TTL);

        if (!$locked) {
            return null;
        }

        return $lockValue;
    }

    public function unlockSpot(string $lockKey): bool
    {
        return (bool) Redis::del($lockKey);
    }

    public function isSpotLocked(int $spotId, Carbon $startTime, Carbon $endTime): bool
    {
        $lockKey = self::LOCK_PREFIX . "{$spotId}:{$startTime->timestamp}:{$endTime->timestamp}";
        return Redis::exists($lockKey) > 0;
    }

    public function createBooking(array $data): Booking
    {
        $spot = ParkingSpot::findOrFail($data['spot_id']);

        $startTime = Carbon::parse($data['start_time']);
        $endTime = Carbon::parse($data['end_time']);

        if ($this->checkTimeConflict($data['spot_id'], $startTime, $endTime)) {
            throw new \Exception('该时段已被预约，请选择其他时段');
        }

        $lockKey = $data['lock_key'] ?? null;
        if ($lockKey) {
            $redisKey = self::LOCK_PREFIX . "{$data['spot_id']}:{$startTime->timestamp}:{$endTime->timestamp}";
            if (Redis::get($redisKey) !== $lockKey) {
                throw new \Exception('订单锁定已失效，请重新提交');
            }
        }

        return DB::transaction(function () use ($data, $spot, $startTime, $endTime, $lockKey) {
            $totalMinutes = $startTime->diffInMinutes($endTime);
            $totalAmount = $this->calculateAmount($spot, $totalMinutes);

            $platformFee = $totalAmount * self::PLATFORM_FEE_RATE;
            $ownerEarning = $totalAmount - $platformFee;

            $crossMidnight = $startTime->toDateString() !== $endTime->toDateString();

            $booking = Booking::create([
                'spot_id' => $data['spot_id'],
                'visitor_id' => $data['visitor_id'],
                'availability_id' => $data['availability_id'] ?? null,
                'license_plate' => strtoupper($data['license_plate']),
                'start_time' => $startTime,
                'end_time' => $endTime,
                'total_amount' => $totalAmount,
                'owner_earning' => $ownerEarning,
                'platform_fee' => $platformFee,
                'status' => 'pending',
                'cross_midnight' => $crossMidnight,
                'is_locked' => true,
                'locked_at' => now(),
                'lock_expires_at' => time() + self::LOCK_TTL,
                'lock_key' => $lockKey,
            ]);

            if ($crossMidnight) {
                $this->createDailySplits($booking);
            }

            if ($lockKey) {
                $redisKey = self::LOCK_PREFIX . "{$data['spot_id']}:{$startTime->timestamp}:{$endTime->timestamp}";
                Redis::del($redisKey);
            }

            return $booking->fresh();
        });
    }

    protected function calculateAmount(ParkingSpot $spot, int $totalMinutes): float
    {
        $hours = ceil($totalMinutes / 60);
        $days = floor($hours / 24);
        $remainingHours = $hours % 24;

        $amount = 0;
        if ($days > 0 && $spot->daily_rate > 0) {
            $amount += $days * $spot->daily_rate;
            $amount += $remainingHours * $spot->hourly_rate;
        } else {
            $amount = $hours * $spot->hourly_rate;
        }

        return max($amount, $spot->hourly_rate);
    }

    public function createDailySplits(Booking $booking): void
    {
        $start = $booking->start_time->copy();
        $end = $booking->end_time->copy();

        $current = $start->copy();
        $splits = [];

        while ($current->lt($end)) {
            $splitDate = $current->toDateString();
            $dayEnd = $current->copy()->endOfDay();

            if ($dayEnd->gt($end)) {
                $dayEnd = $end->copy();
            }

            $duration = $current->diffInMinutes($dayEnd);
            $ratio = $duration / $booking->getDurationInMinutes();
            $segmentAmount = $booking->total_amount * $ratio;
            $ownerShare = $booking->owner_earning * $ratio;
            $platformShare = $booking->platform_fee * $ratio;

            $splits[] = [
                'booking_id' => $booking->id,
                'split_date' => $splitDate,
                'segment_start' => $current,
                'segment_end' => $dayEnd,
                'duration_minutes' => $duration,
                'segment_amount' => round($segmentAmount, 2),
                'owner_share' => round($ownerShare, 2),
                'platform_share' => round($platformShare, 2),
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $current = $dayEnd->copy()->addMinute()->startOfDay();
        }

        BookingDailySplit::insert($splits);
    }

    public function confirmBooking(Booking $booking): Booking
    {
        if ($booking->status !== 'pending') {
            throw new \Exception('订单状态不允许确认');
        }

        $booking->update([
            'status' => 'confirmed',
            'is_locked' => false,
            'lock_key' => null,
            'lock_expires_at' => null,
        ]);

        return $booking;
    }

    public function cancelBooking(Booking $booking, string $reason = ''): Booking
    {
        if (!$booking->canBeCancelled()) {
            throw new \Exception('订单当前状态不可取消');
        }

        return DB::transaction(function () use ($booking, $reason) {
            $booking->update([
                'status' => 'cancelled',
                'cancel_reason' => $reason,
                'is_locked' => false,
                'lock_key' => null,
            ]);

            if ($booking->payments()->where('status', 'success')->exists()) {
                $refundAmount = $booking->total_amount;
                $booking->update(['refund_amount' => $refundAmount]);

                Payment::create([
                    'booking_id' => $booking->id,
                    'user_id' => $booking->visitor_id,
                    'amount' => -$refundAmount,
                    'type' => 'refund',
                    'method' => 'balance',
                    'status' => 'success',
                    'paid_at' => now(),
                ]);
            }

            return $booking;
        });
    }

    public function rollbackBooking(Booking $booking): bool
    {
        return DB::transaction(function () use ($booking) {
            $booking->dailySplits()->delete();
            $booking->payments()->delete();
            $booking->entryRecords()->delete();
            $booking->delete();

            return true;
        });
    }
}
