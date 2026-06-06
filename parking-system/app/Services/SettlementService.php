<?php

namespace App\Services;

use App\Models\Settlement;
use App\Models\SettlementItem;
use App\Models\Booking;
use App\Models\ParkingViolation;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SettlementService
{
    public function generateSettlement(int $ownerId, Carbon $periodStart, Carbon $periodEnd): Settlement
    {
        return DB::transaction(function () use ($ownerId, $periodStart, $periodEnd) {
            $existing = Settlement::where('owner_id', $ownerId)
                ->where('period_start', $periodStart->toDateString())
                ->where('period_end', $periodEnd->toDateString())
                ->first();

            if ($existing) {
                throw new \Exception('该周期结算已存在');
            }

            $bookings = Booking::whereHas('spot', function ($q) use ($ownerId) {
                $q->where('owner_id', $ownerId);
            })
                ->whereBetween('start_time', [$periodStart, $periodEnd])
                ->whereIn('status', ['completed', 'paid', 'in_progress'])
                ->get();

            $violations = ParkingViolation::whereHas('spot', function ($q) use ($ownerId) {
                $q->where('owner_id', $ownerId);
            })
                ->whereBetween('violation_time', [$periodStart, $periodEnd])
                ->where('status', 'paid')
                ->get();

            $totalBookingAmount = $bookings->sum('total_amount');
            $totalOwnerEarning = $bookings->sum('owner_earning');
            $totalPlatformFee = $bookings->sum('platform_fee');
            $totalRefund = $bookings->sum('refund_amount');
            $totalFineIncome = $violations->sum('fine_amount') * 0.5;
            $manualInterventionCount = $bookings->sum('manual_intervention_count');

            $netSettlement = $totalOwnerEarning + $totalFineIncome - $totalRefund;

            $settlement = Settlement::create([
                'owner_id' => $ownerId,
                'period_start' => $periodStart->toDateString(),
                'period_end' => $periodEnd->toDateString(),
                'total_booking_amount' => $totalBookingAmount,
                'total_owner_earning' => $totalOwnerEarning,
                'total_platform_fee' => $totalPlatformFee,
                'total_refund' => $totalRefund,
                'total_fine_income' => $totalFineIncome,
                'net_settlement' => max(0, $netSettlement),
                'total_bookings' => $bookings->count(),
                'manual_intervention_count' => $manualInterventionCount,
                'status' => 'pending',
            ]);

            foreach ($bookings as $booking) {
                SettlementItem::create([
                    'settlement_id' => $settlement->id,
                    'booking_id' => $booking->id,
                    'type' => 'booking_income',
                    'amount' => $booking->total_amount,
                    'owner_share' => $booking->owner_earning,
                    'platform_share' => $booking->platform_fee,
                    'description' => "订单 {$booking->booking_no} 收入",
                ]);

                if ($booking->refund_amount > 0) {
                    SettlementItem::create([
                        'settlement_id' => $settlement->id,
                        'booking_id' => $booking->id,
                        'type' => 'refund',
                        'amount' => -$booking->refund_amount,
                        'owner_share' => -$booking->refund_amount * 0.9,
                        'platform_share' => -$booking->refund_amount * 0.1,
                        'description' => "订单 {$booking->booking_no} 退款",
                    ]);
                }
            }

            foreach ($violations as $violation) {
                $ownerShare = $violation->fine_amount * 0.5;
                $platformShare = $violation->fine_amount * 0.5;
                SettlementItem::create([
                    'settlement_id' => $settlement->id,
                    'violation_id' => $violation->id,
                    'type' => 'fine',
                    'amount' => $violation->fine_amount,
                    'owner_share' => $ownerShare,
                    'platform_share' => $platformShare,
                    'description' => "违停 {$violation->violation_no} 罚款分成",
                ]);
            }

            return $settlement->fresh(['items']);
        });
    }

    public function completeSettlement(Settlement $settlement): Settlement
    {
        if ($settlement->status !== 'pending') {
            throw new \Exception('结算状态不允许完成');
        }

        $settlement->update([
            'status' => 'completed',
            'settled_at' => now(),
        ]);

        return $settlement;
    }

    public function getSettlementSummary(int $ownerId, Carbon $date): array
    {
        $startOfMonth = $date->copy()->startOfMonth();
        $endOfMonth = $date->copy()->endOfMonth();

        $bookings = Booking::whereHas('spot', function ($q) use ($ownerId) {
            $q->where('owner_id', $ownerId);
        })
            ->whereBetween('start_time', [$startOfMonth, $endOfMonth])
            ->whereIn('status', ['completed', 'paid', 'in_progress'])
            ->get();

        $manualCount = $bookings->sum('manual_intervention_count');
        $crossMidnightCount = $bookings->where('cross_midnight', true)->count();

        return [
            'period' => $startOfMonth->format('Y-m'),
            'total_bookings' => $bookings->count(),
            'total_amount' => $bookings->sum('total_amount'),
            'owner_earning' => $bookings->sum('owner_earning'),
            'platform_fee' => $bookings->sum('platform_fee'),
            'refund_amount' => $bookings->sum('refund_amount'),
            'manual_intervention_count' => $manualCount,
            'cross_midnight_count' => $crossMidnightCount,
        ];
    }
}
