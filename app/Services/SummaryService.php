<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Registration;
use App\Models\ConversionSummary;
use App\Models\AttendanceSummary;
use App\Models\RegistrationSessionPivot;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SummaryService
{
    public function calculateDailyConversion(int $eventId, string $date): ConversionSummary
    {
        $event = Event::findOrFail($eventId);

        $inquiryQuery = Registration::where('event_id', $eventId)
            ->whereDate('created_at', $date);
        $newInquiry = (clone $inquiryQuery)->count();

        $registeredQuery = Registration::where('event_id', $eventId)
            ->where('conversion_stage', 'registered')
            ->whereDate('created_at', $date);
        $newRegistered = (clone $registeredQuery)->count();

        $confirmedQuery = Registration::where('event_id', $eventId)
            ->where('conversion_stage', 'confirmed')
            ->whereDate('confirmed_at', $date);
        $newConfirmed = (clone $confirmedQuery)->count();

        $paidQuery = Registration::where('event_id', $eventId)
            ->where('conversion_stage', 'paid')
            ->whereDate('paid_at', $date);
        $newPaid = (clone $paidQuery)->count();
        $newPaidAmount = (clone $paidQuery)->sum('paid_amount');

        $newLost = Registration::where('event_id', $eventId)
            ->where('conversion_stage', 'lost')
            ->whereDate('updated_at', $date)
            ->count();

        $totalQuery = Registration::where('event_id', $eventId)
            ->whereDate('created_at', '<=', $date);
        $totalInquiry = (clone $totalQuery)->count();
        $totalRegistered = (clone $totalQuery)->whereIn('conversion_stage', ['registered', 'confirmed', 'paid', 'ticket_sent', 'lost'])->count();
        $totalConfirmed = (clone $totalQuery)->whereIn('conversion_stage', ['confirmed', 'paid', 'ticket_sent'])->count();
        $totalPaid = (clone $totalQuery)->whereIn('conversion_stage', ['paid', 'ticket_sent'])->count();
        $totalPaidAmount = Registration::where('event_id', $eventId)
            ->whereIn('conversion_stage', ['paid', 'ticket_sent'])
            ->whereDate('paid_at', '<=', $date)
            ->sum('paid_amount');
        $totalLost = (clone $totalQuery)->where('conversion_stage', 'lost')->count();

        $conversionRate = $totalInquiry > 0 ? round($totalPaid / $totalInquiry, 4) : 0;

        return ConversionSummary::updateOrCreate(
            ['event_id' => $eventId, 'summary_date' => $date],
            [
                'new_inquiry_count' => $newInquiry,
                'new_registered_count' => $newRegistered,
                'new_confirmed_count' => $newConfirmed,
                'new_paid_count' => $newPaid,
                'new_lost_count' => $newLost,
                'total_inquiry_count' => $totalInquiry,
                'total_registered_count' => $totalRegistered,
                'total_confirmed_count' => $totalConfirmed,
                'total_paid_count' => $totalPaid,
                'total_paid_amount' => $totalPaidAmount,
                'total_lost_count' => $totalLost,
                'conversion_rate' => $conversionRate,
                'created_by' => auth()->id() ?? 1,
            ]
        );
    }

    public function calculateDailyAttendance(int $eventId, ?int $sessionId, string $date): AttendanceSummary
    {
        $baseQuery = Registration::where('event_id', $eventId)
            ->whereDate('created_at', '<=', $date);

        if ($sessionId) {
            $baseQuery->whereExists(function ($q) use ($sessionId) {
                $q->select(DB::raw(1))
                    ->from('registration_session_pivots')
                    ->whereColumn('registration_session_pivots.registration_id', 'registrations.id')
                    ->where('registration_session_pivots.session_id', $sessionId);
            });
        }

        $registeredCount = (clone $baseQuery)->count();
        $confirmedCount = (clone $baseQuery)
            ->whereIn('registration_status', ['approved', 'paid'])
            ->count();

        if ($sessionId) {
            $arrivedCount = RegistrationSessionPivot::where('session_id', $sessionId)
                ->where('attendance_status', 'arrived')
                ->whereDate('created_at', '<=', $date)
                ->count();
            $noShowCount = RegistrationSessionPivot::where('session_id', $sessionId)
                ->where('attendance_status', 'no_show')
                ->whereDate('created_at', '<=', $date)
                ->count();
        } else {
            $arrivedQuery = clone $baseQuery;
            $arrivedCount = $arrivedQuery->where('attendance_status', 'arrived')->count();
            $noShowCount = (clone $baseQuery)->where('attendance_status', 'no_show')->count();
        }

        $attendanceRate = $confirmedCount > 0 ? round($arrivedCount / $confirmedCount, 4) : 0;

        $seatCapacity = 0;
        $seatSold = 0;
        if ($sessionId) {
            $session = \App\Models\EventSession::find($sessionId);
            $seatCapacity = $session?->seat_count ?? 0;
            $seatSold = RegistrationSessionPivot::where('session_id', $sessionId)->count();
        } else {
            $event = Event::find($eventId);
            $seatCapacity = $event?->sessions()->sum('seat_count') ?? 0;
            $seatSold = RegistrationSessionPivot::whereHas('session', function ($q) use ($eventId) {
                $q->where('event_id', $eventId);
            })->count();
        }

        $seatOccupied = $arrivedCount;
        $arrivalRate = $seatCapacity > 0 ? round($seatOccupied / $seatCapacity, 4) : 0;

        return AttendanceSummary::updateOrCreate(
            [
                'event_id' => $eventId,
                'session_id' => $sessionId,
                'summary_date' => $date,
            ],
            [
                'registered_count' => $registeredCount,
                'confirmed_count' => $confirmedCount,
                'arrived_count' => $arrivedCount,
                'no_show_count' => $noShowCount,
                'attendance_rate' => $attendanceRate,
                'arrival_rate' => $arrivalRate,
                'seat_capacity' => $seatCapacity,
                'seat_sold' => $seatSold,
                'seat_occupied' => $seatOccupied,
                'created_by' => auth()->id() ?? 1,
            ]
        );
    }

    public function refreshAllSummaries(int $eventId): array
    {
        $event = Event::findOrFail($eventId);
        $startDate = $event->created_at->startOfDay();
        $endDate = now()->endOfDay();

        $conversionResults = [];
        $attendanceResults = [];

        try {
            DB::beginTransaction();

            for ($date = clone $startDate; $date->lte($endDate); $date->addDay()) {
                $dateStr = $date->toDateString();
                $conversionResults[] = $this->calculateDailyConversion($eventId, $dateStr);
                $attendanceResults[] = $this->calculateDailyAttendance($eventId, null, $dateStr);

                foreach ($event->sessions as $session) {
                    $attendanceResults[] = $this->calculateDailyAttendance($eventId, $session->id, $dateStr);
                }
            }

            DB::commit();

            return [
                'success' => true,
                'conversion_count' => count($conversionResults),
                'attendance_count' => count($attendanceResults),
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Refresh summaries failed', [
                'event_id' => $eventId,
                'error' => $e->getMessage(),
            ]);
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
