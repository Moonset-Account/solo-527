<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Registration;
use App\Models\DuplicateSeatRecord;
use App\Models\ConversionSummary;
use App\Models\AttendanceSummary;
use App\Models\RegistrationQualityScore;
use App\Models\RefundRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $eventId = $request->input('event_id');

        $eventsQuery = Event::query()->orderBy('start_time', 'desc');
        if (!auth()->user()->isManager()) {
            $eventsQuery = Event::where('created_by', auth()->id())
                ->orWhereHas('registrations', fn($q) => $q->where('created_by', auth()->id()))
                ->orderBy('start_time', 'desc');
        }
        $events = $eventsQuery->limit(10)->get(['id', 'name', 'start_time', 'status']);

        $event = $eventId ? Event::find($eventId) : $events->first();
        $selectedEventId = $event?->id;

        if (!$selectedEventId) {
            return Inertia::render('Dashboard/Index', [
                'events' => $events,
                'selectedEvent' => null,
                'stats' => [],
                'conversionFunnel' => [],
                'attendanceTrend' => [],
                'qualityDistribution' => [],
                'duplicatePendingCount' => 0,
                'refundPendingCount' => 0,
                'recentRegistrations' => [],
            ]);
        }

        $event = Event::with(['sessions:id,event_id,name,start_time,seat_count'])->find($selectedEventId);

        $cacheKey = "dashboard:event:{$selectedEventId}:stats:" . date('Y-m-d-H-i');
        $stats = Redis::get($cacheKey);
        if (!$stats) {
            $stats = $this->calculateStats($selectedEventId);
            Redis::setex($cacheKey, 300, json_encode($stats, JSON_UNESCAPED_UNICODE));
        } else {
            $stats = json_decode($stats, true);
        }

        $conversionFunnel = $this->getConversionFunnel($selectedEventId);
        $attendanceTrend = $this->getAttendanceTrend($selectedEventId);
        $qualityDistribution = $this->getQualityDistribution($selectedEventId);
        $sourceChannelStats = $this->getSourceChannelStats($selectedEventId);
        $sessionStats = $this->getSessionStats($selectedEventId);

        $duplicatePendingCount = DuplicateSeatRecord::where('event_id', $selectedEventId)
            ->whereIn('status', ['pending', 'processing'])
            ->count();

        $refundPendingCount = RefundRequest::where('event_id', $selectedEventId)
            ->whereIn('status', ['pending', 'approved', 'processing'])
            ->count();

        $recentRegistrations = Registration::with(['qualityScore'])
            ->where('event_id', $selectedEventId)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get([
                'id', 'registration_no', 'name', 'company', 'position',
                'conversion_stage', 'attendance_status', 'created_at', 'paid_amount',
            ])
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'registration_no' => $r->registration_no,
                    'name' => $r->name,
                    'company' => $r->company,
                    'position' => $r->position,
                    'conversion_stage' => $r->conversion_stage_text,
                    'attendance_status' => $r->attendance_status_text,
                    'created_at' => $r->created_at?->toDateTimeString(),
                    'paid_amount' => $r->paid_amount,
                    'quality_level' => $r->qualityScore?->level_label,
                    'quality_color' => $r->qualityScore?->level_color,
                    'total_score' => $r->qualityScore?->total_score,
                ];
            });

        return Inertia::render('Dashboard/Index', [
            'events' => $events,
            'selectedEvent' => $event ? [
                'id' => $event->id,
                'name' => $event->name,
                'theme' => $event->theme,
                'start_time' => $event->start_time?->toDateTimeString(),
                'end_time' => $event->end_time?->toDateTimeString(),
                'location' => $event->location,
                'status' => $event->status,
            ] : null,
            'stats' => $stats,
            'conversionFunnel' => $conversionFunnel,
            'attendanceTrend' => $attendanceTrend,
            'qualityDistribution' => $qualityDistribution,
            'sourceChannelStats' => $sourceChannelStats,
            'sessionStats' => $sessionStats,
            'duplicatePendingCount' => $duplicatePendingCount,
            'refundPendingCount' => $refundPendingCount,
            'recentRegistrations' => $recentRegistrations,
            'canManage' => auth()->user()->isManager(),
            'canOperateTicket' => auth()->user()->isTicketOperator(),
        ]);
    }

    protected function calculateStats(int $eventId): array
    {
        $registered = Registration::where('event_id', $eventId)->count();
        $confirmed = Registration::where('event_id', $eventId)
            ->whereIn('registration_status', ['approved'])
            ->count();
        $paid = Registration::where('event_id', $eventId)
            ->where('conversion_stage', 'paid')
            ->count();
        $arrived = Registration::where('event_id', $eventId)
            ->where('attendance_status', 'arrived')
            ->count();
        $paidAmount = Registration::where('event_id', $eventId)
            ->sum('paid_amount');

        $lost = Registration::where('event_id', $eventId)
            ->where('conversion_stage', 'lost')
            ->count();

        $seatCapacity = Event::withSum('sessions', 'seat_count')->find($eventId)?->sessions_sum_seat_count ?? 0;

        $keyCustomers = RegistrationQualityScore::where('event_id', $eventId)
            ->where('is_key_customer', true)
            ->count();

        $vips = RegistrationQualityScore::where('event_id', $eventId)
            ->where('is_vip', true)
            ->count();

        $avgQualityScore = RegistrationQualityScore::where('event_id', $eventId)
            ->avg('total_score') ?? 0;

        $conversionRate = $registered > 0 ? round($paid / $registered, 4) : 0;
        $attendanceRate = $confirmed > 0 ? round($arrived / $confirmed, 4) : 0;
        $arrivalRate = $seatCapacity > 0 ? round($arrived / $seatCapacity, 4) : 0;

        return [
            'registered' => $registered,
            'confirmed' => $confirmed,
            'paid' => $paid,
            'arrived' => $arrived,
            'lost' => $lost,
            'paid_amount' => $paidAmount,
            'seat_capacity' => $seatCapacity,
            'key_customers' => $keyCustomers,
            'vips' => $vips,
            'avg_quality_score' => round($avgQualityScore, 1),
            'conversion_rate' => $conversionRate,
            'attendance_rate' => $attendanceRate,
            'arrival_rate' => $arrivalRate,
            'paid_per_registration' => $paid > 0 ? round($paidAmount / $paid, 2) : 0,
        ];
    }

    protected function getConversionFunnel(int $eventId): array
    {
        $stages = ['inquiry', 'registered', 'confirmed', 'paid', 'ticket_sent', 'lost'];
        $result = [];

        foreach ($stages as $stage) {
            $count = Registration::where('event_id', $eventId)
                ->where('conversion_stage', $stage)
                ->count();
            $result[] = [
                'stage' => $stage,
                'label' => Registration::CONVERSION_STAGES[$stage] ?? $stage,
                'count' => $count,
            ];
        }

        return $result;
    }

    protected function getAttendanceTrend(int $eventId): array
    {
        $startDate = Registration::where('event_id', $eventId)->min('created_at');
        if (!$startDate) return [];

        $start = \Illuminate\Support\Carbon::parse($startDate)->startOfDay();
        $end = now()->startOfDay();
        $days = min(30, $start->diffInDays($end) + 1);

        $trend = [];
        for ($i = 0; $i < $days; $i++) {
            $date = $start->copy()->addDays($i)->toDateString();

            $regCount = Registration::where('event_id', $eventId)
                ->whereDate('created_at', $date)
                ->count();

            $arrCount = Registration::where('event_id', $eventId)
                ->where('attendance_status', 'arrived')
                ->whereDate('updated_at', $date)
                ->count();

            $trend[] = [
                'date' => $date,
                'registrations' => $regCount,
                'arrivals' => $arrCount,
            ];
        }

        return $trend;
    }

    protected function getQualityDistribution(int $eventId): array
    {
        $levels = ['S', 'A', 'B', 'C', 'D'];
        $result = [];

        foreach ($levels as $level) {
            $count = RegistrationQualityScore::where('event_id', $eventId)
                ->where('quality_level', $level)
                ->count();
            $config = RegistrationQualityScore::QUALITY_LEVELS[$level];
            $result[] = [
                'level' => $level,
                'label' => $config['label'],
                'color' => $config['color'],
                'count' => $count,
            ];
        }

        return $result;
    }

    protected function getSourceChannelStats(int $eventId): array
    {
        return Registration::where('event_id', $eventId)
            ->select('source_channel', DB::raw('count(*) as count'), DB::raw('sum(paid_amount) as amount'))
            ->groupBy('source_channel')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get()
            ->map(fn($r) => [
                'channel' => $r->source_channel ?: '未指定',
                'count' => (int) $r->count,
                'amount' => (float) $r->amount,
            ])
            ->toArray();
    }

    protected function getSessionStats(int $eventId): array
    {
        $event = Event::with(['sessions' => function ($q) {
            $q->withCount(['registrationPivots as total_count'])
                ->withCount(['registrationPivots as arrived_count' => function ($q) {
                    $q->where('attendance_status', 'arrived');
                }]);
        }])->find($eventId);

        return $event?->sessions->map(function ($s) {
            $capacity = $s->seat_count;
            $rate = $capacity > 0 ? round($s->arrived_count / $capacity, 4) : 0;
            return [
                'id' => $s->id,
                'name' => $s->name,
                'start_time' => $s->start_time?->toDateTimeString(),
                'capacity' => $capacity,
                'registered' => $s->total_count ?? 0,
                'arrived' => $s->arrived_count ?? 0,
                'arrival_rate' => $rate,
            ];
        })->toArray() ?? [];
    }
}
