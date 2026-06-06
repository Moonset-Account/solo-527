<?php

namespace App\Services;

use App\Models\Coach;
use App\Models\CoachAvailableTime;
use App\Models\Booking;
use Carbon\Carbon;

class CoachCalendarService
{
    public function getCoachCalendar($coachId, $startDate, $endDate)
    {
        $coach = Coach::findOrFail($coachId);
        $startDate = Carbon::parse($startDate)->startOfDay();
        $endDate = Carbon::parse($endDate)->endOfDay();

        $bookings = Booking::where('coach_id', $coachId)
            ->whereBetween('start_time', [$startDate, $endDate])
            ->with(['member.user', 'courseType', 'attendance'])
            ->orderBy('start_time')
            ->get();

        $availableTimes = $coach->availableTimes()
            ->where('is_active', true)
            ->get();

        $calendar = [];
        $currentDate = $startDate->copy();

        while ($currentDate->lte($endDate)) {
            $dayOfWeek = $currentDate->dayOfWeek;
            $dateStr = $currentDate->format('Y-m-d');

            $dayAvailableTimes = $availableTimes->filter(function ($time) use ($dayOfWeek, $currentDate) {
                if ($time->is_recurring) {
                    return $time->day_of_week == $dayOfWeek;
                }
                return $time->specific_date && $time->specific_date->isSameDay($currentDate);
            });

            $dayBookings = $bookings->filter(function ($booking) use ($currentDate) {
                return $booking->start_time->isSameDay($currentDate);
            });

            $calendar[$dateStr] = [
                'date' => $dateStr,
                'day_of_week' => $dayOfWeek,
                'available_times' => $dayAvailableTimes->values(),
                'bookings' => $dayBookings->values(),
            ];

            $currentDate->addDay();
        }

        return $calendar;
    }

    public function getAvailableSlots($coachId, $courseTypeId, $date)
    {
        $coach = Coach::findOrFail($coachId);
        $date = Carbon::parse($date);
        $dayOfWeek = $date->dayOfWeek;

        $availableTimes = $coach->availableTimes()
            ->where('is_active', true)
            ->where(function ($query) use ($dayOfWeek, $date) {
                $query->where(function ($q) use ($dayOfWeek) {
                    $q->where('is_recurring', true)
                        ->where('day_of_week', $dayOfWeek);
                })->orWhere(function ($q) use ($date) {
                    $q->where('is_recurring', false)
                        ->whereDate('specific_date', $date);
                });
            })
            ->get();

        $bookings = Booking::where('coach_id', $coachId)
            ->whereDate('start_time', $date)
            ->whereIn('status', ['pending', 'confirmed'])
            ->get();

        $courseType = \App\Models\CourseType::findOrFail($courseTypeId);
        $durationMinutes = $courseType->duration_minutes;

        $slots = [];

        foreach ($availableTimes as $availableTime) {
            $slotStart = Carbon::parse($date->format('Y-m-d') . ' ' . $availableTime->start_time);
            $slotEnd = Carbon::parse($date->format('Y-m-d') . ' ' . $availableTime->end_time);

            $currentSlotStart = $slotStart->copy();

            while ($currentSlotStart->copy()->addMinutes($durationMinutes)->lte($slotEnd)) {
                $currentSlotEnd = $currentSlotStart->copy()->addMinutes($durationMinutes);

                $conflict = $bookings->contains(function ($booking) use ($currentSlotStart, $currentSlotEnd) {
                    return $this->timesOverlap(
                        $booking->start_time,
                        $booking->end_time,
                        $currentSlotStart,
                        $currentSlotEnd
                    );
                });

                if (!$conflict) {
                    $slots[] = [
                        'start_time' => $currentSlotStart->format('Y-m-d H:i:s'),
                        'end_time' => $currentSlotEnd->format('Y-m-d H:i:s'),
                        'available' => true,
                    ];
                }

                $currentSlotStart->addMinutes(30);
            }
        }

        return $slots;
    }

    protected function timesOverlap($start1, $end1, $start2, $end2)
    {
        return $start1->lt($end2) && $start2->lt($end1);
    }

    public function setAvailableTime($coachId, array $data)
    {
        return CoachAvailableTime::create([
            'coach_id' => $coachId,
            'day_of_week' => $data['day_of_week'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'is_recurring' => $data['is_recurring'] ?? true,
            'specific_date' => $data['specific_date'] ?? null,
            'is_active' => true,
        ]);
    }

    public function removeAvailableTime($availableTimeId)
    {
        $availableTime = CoachAvailableTime::findOrFail($availableTimeId);
        $availableTime->delete();
        return true;
    }

    public function getCoachStats($coachId, $startDate, $endDate)
    {
        $startDate = Carbon::parse($startDate);
        $endDate = Carbon::parse($endDate);

        $totalBookings = Booking::where('coach_id', $coachId)
            ->whereBetween('start_time', [$startDate, $endDate])
            ->count();

        $completedBookings = Booking::where('coach_id', $coachId)
            ->whereBetween('start_time', [$startDate, $endDate])
            ->where('status', 'completed')
            ->count();

        $cancelledBookings = Booking::where('coach_id', $coachId)
            ->whereBetween('start_time', [$startDate, $endDate])
            ->where('status', 'cancelled')
            ->count();

        $totalRevenue = \App\Models\CoachRevenueLog::where('coach_id', $coachId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('amount');

        return [
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
            ],
            'total_bookings' => $totalBookings,
            'completed_bookings' => $completedBookings,
            'cancelled_bookings' => $cancelledBookings,
            'attendance_rate' => $totalBookings > 0 ? round($completedBookings / $totalBookings * 100, 2) : 0,
            'total_revenue' => $totalRevenue,
        ];
    }
}
