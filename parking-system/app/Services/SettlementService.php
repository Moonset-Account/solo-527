<?php

namespace App\Services;

use App\Models\Settlement;
use App\Models\SettlementItem;
use App\Models\Booking;
use App\Models\BookingDailySplit;
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

            $periodStartDate = $periodStart->startOfDay();
            $periodEndDate = $periodEnd->endOfDay();

            $dailySplits = BookingDailySplit::whereHas('booking.spot', function ($q) use ($ownerId) {
                $q->where('owner_id', $ownerId);
            })
                ->whereBetween('split_date', [$periodStartDate->toDateString(), $periodEndDate->toDateString()])
                ->whereHas('booking', function ($q) {
                    $q->whereIn('status', ['completed', 'paid', 'in_progress']);
                })
                ->with('booking')
                ->get();

            $bookingsInPeriod = $dailySplits->pluck('booking')->unique('id');

            $totalBookingAmount = $dailySplits->sum('segment_amount');
            $totalOwnerEarning = $dailySplits->sum('owner_share');
            $totalPlatformFee = $dailySplits->sum('platform_share');

            $violationNos = ParkingViolation::whereHas('spot', function ($q) use ($ownerId) {
                $q->where('owner_id', $ownerId);
            })->pluck('violation_no')->toArray();

            $refundPayments = Payment::where(function ($q) use ($ownerId, $violationNos) {
                $q->whereHas('booking.spot', function ($spotQ) use ($ownerId) {
                    $spotQ->where('owner_id', $ownerId);
                });
                if (!empty($violationNos)) {
                    $q->orWhere(function ($subQ) use ($violationNos) {
                        $subQ->whereNull('booking_id')
                            ->where(function ($remarkQ) use ($violationNos) {
                                foreach ($violationNos as $no) {
                                    $remarkQ->orWhere('remark', 'LIKE', "%{$no}%");
                                }
                            });
                    });
                }
            })
                ->where('type', 'refund')
                ->where('status', 'success')
                ->whereBetween('paid_at', [$periodStartDate, $periodEndDate])
                ->get();

            $totalRefund = abs($refundPayments->sum('amount'));

            $finePayments = Payment::whereNull('booking_id')
                ->where('type', 'fine')
                ->where('status', 'success')
                ->whereBetween('paid_at', [$periodStartDate, $periodEndDate])
                ->where(function ($q) use ($violationNos) {
                    if (!empty($violationNos)) {
                        foreach ($violationNos as $no) {
                            $q->orWhere('remark', 'LIKE', "%{$no}%");
                        }
                    } else {
                        $q->whereRaw('1=0');
                    }
                })
                ->get();

            $totalFineAmount = $finePayments->sum('amount');
            $totalFineIncome = round($totalFineAmount * 0.5, 2);
            $totalFinePlatformFee = round($totalFineAmount * 0.5, 2);

            $manualInterventionCount = 0;
            foreach ($bookingsInPeriod as $booking) {
                $bookingDays = $booking->dailySplits->count();
                if ($bookingDays > 0) {
                    $periodSplitDays = $dailySplits->where('booking_id', $booking->id)->count();
                    $ratio = $periodSplitDays / $bookingDays;
                    $manualInterventionCount += (int) round($booking->manual_intervention_count * $ratio);
                }
            }

            $netSettlement = $totalOwnerEarning + $totalFineIncome - $totalRefund;

            $settlement = Settlement::create([
                'owner_id' => $ownerId,
                'period_start' => $periodStartDate->toDateString(),
                'period_end' => $periodEndDate->toDateString(),
                'total_booking_amount' => round($totalBookingAmount, 2),
                'total_owner_earning' => round($totalOwnerEarning, 2),
                'total_platform_fee' => round($totalPlatformFee + $totalFinePlatformFee, 2),
                'total_refund' => round($totalRefund, 2),
                'total_fine_income' => $totalFineIncome,
                'net_settlement' => max(0, round($netSettlement, 2)),
                'total_bookings' => $bookingsInPeriod->count(),
                'manual_intervention_count' => $manualInterventionCount,
                'status' => 'pending',
            ]);

            foreach ($dailySplits as $split) {
                SettlementItem::create([
                    'settlement_id' => $settlement->id,
                    'booking_id' => $split->booking_id,
                    'type' => 'booking_income',
                    'amount' => $split->segment_amount,
                    'owner_share' => $split->owner_share,
                    'platform_share' => $split->platform_share,
                    'description' => "订单 {$split->booking->booking_no} - {$split->split_date} 收入",
                ]);
            }

            foreach ($refundPayments as $payment) {
                $ownerRefund = round(abs($payment->amount) * 0.9, 2);
                $platformRefund = round(abs($payment->amount) * 0.1, 2);
                SettlementItem::create([
                    'settlement_id' => $settlement->id,
                    'booking_id' => $payment->booking_id,
                    'payment_id' => $payment->id,
                    'type' => 'refund',
                    'amount' => $payment->amount,
                    'owner_share' => -$ownerRefund,
                    'platform_share' => -$platformRefund,
                    'description' => $payment->remark ?: "订单退款",
                ]);
            }

            foreach ($finePayments as $payment) {
                $ownerShare = round($payment->amount * 0.5, 2);
                $platformShare = round($payment->amount * 0.5, 2);
                SettlementItem::create([
                    'settlement_id' => $settlement->id,
                    'payment_id' => $payment->id,
                    'type' => 'fine',
                    'amount' => $payment->amount,
                    'owner_share' => $ownerShare,
                    'platform_share' => $platformShare,
                    'description' => $payment->remark ?: "违停罚款分成",
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
