<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\DuplicateSeatRecord;
use App\Models\Registration;
use App\Models\AttendanceSummary;
use App\Models\EventSeat;
use App\Models\RegistrationSessionPivot;
use App\Models\NotificationRecord;
use App\Services\SummaryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DuplicateSeatController extends Controller
{
    protected SummaryService $summaryService;

    public function __construct(SummaryService $summaryService)
    {
        $this->summaryService = $summaryService;
    }

    public function index(Request $request)
    {
        $eventId = $request->input('event_id');
        $status = $request->input('status', 'pending');
        $conflictType = $request->input('conflict_type');
        $assignedTo = $request->input('assigned_to');

        $events = Event::orderBy('start_time', 'desc')->get(['id', 'name']);

        $query = DuplicateSeatRecord::with(['event:id,name', 'session:id,name', 'seat', 'assignee:id,name,department', 'resolver:id,name', 'finalRegistration:id,registration_no,name'])
            ->when($eventId, fn($q, $eid) => $q->where('event_id', $eid))
            ->when($conflictType, fn($q, $t) => $q->where('conflict_type', $t))
            ->when($assignedTo, fn($q, $uid) => $q->where('assigned_to', $uid));

        if ($status === 'pending') {
            $query->whereIn('status', ['pending', 'processing']);
        } elseif ($status === 'resolved') {
            $query->where(function ($q) {
                $q->where('status', 'like', 'resolved_%')
                    ->orWhere('status', 'closed');
            });
        } elseif ($status) {
            $query->where('status', $status);
        }

        $records = $query->orderBy('created_at', 'desc')
            ->paginate(30)
            ->through(fn($d) => [
                'id' => $d->id,
                'event_id' => $d->event_id,
                'event_name' => $d->event?->name,
                'session_name' => $d->session?->name,
                'seat_display' => $d->seat ? "{$d->seat->zone}{$d->seat->row}排{$d->seat->seat_no}号" : null,
                'phone' => $d->phone,
                'company' => $d->company,
                'conflict_type' => $d->conflict_type,
                'conflict_type_text' => DuplicateSeatRecord::CONFLICT_TYPES[$d->conflict_type] ?? $d->conflict_type,
                'conflict_reason' => $d->conflict_reason,
                'conflict_registration_ids' => $d->conflict_registration_ids,
                'conflict_count' => count($d->conflict_registration_ids ?? []),
                'status' => $d->status,
                'status_text' => DuplicateSeatRecord::STATUSES[$d->status] ?? $d->status,
                'is_pending' => $d->isPending(),
                'is_processing' => $d->isProcessing(),
                'is_resolved' => $d->isResolved(),
                'resolution_note' => $d->resolution_note,
                'final_registration_id' => $d->final_registration_id,
                'final_registration_no' => $d->finalRegistration?->registration_no,
                'final_registrant_name' => $d->finalRegistration?->name,
                'assigned_to' => $d->assigned_to,
                'assignee_name' => $d->assignee?->name,
                'assignee_dept' => $d->assignee?->department,
                'resolved_at' => $d->resolved_at?->toDateTimeString(),
                'resolver_name' => $d->resolver?->name,
                'conflict_registrations' => $d->getConflictRegistrations()->map(fn($r) => [
                    'id' => $r->id,
                    'registration_no' => $r->registration_no,
                    'name' => $r->name,
                    'phone' => $r->phone,
                    'company' => $r->company,
                    'position' => $r->position,
                    'created_at' => $r->created_at?->toDateTimeString(),
                    'conversion_stage' => $r->conversion_stage_text,
                    'paid_amount' => $r->paid_amount,
                    'registration_status' => $r->registration_status_text,
                    'attendance_status' => $r->attendance_status_text,
                ])->toArray(),
                'created_at' => $d->created_at?->toDateTimeString(),
            ]);

        $users = \App\Models\User::select('id', 'name', 'department')
            ->orderBy('name')
            ->get();

        $stats = [
            'total' => DuplicateSeatRecord::when($eventId, fn($q, $eid) => $q->where('event_id', $eid))->count(),
            'pending' => DuplicateSeatRecord::when($eventId, fn($q, $eid) => $q->where('event_id', $eid))
                ->where('status', 'pending')->count(),
            'processing' => DuplicateSeatRecord::when($eventId, fn($q, $eid) => $q->where('event_id', $eid))
                ->where('status', 'processing')->count(),
            'resolved' => DuplicateSeatRecord::when($eventId, fn($q, $eid) => $q->where('event_id', $eid))
                ->resolved()->count(),
            'phone_conflicts' => DuplicateSeatRecord::when($eventId, fn($q, $eid) => $q->where('event_id', $eid))
                ->where('conflict_type', 'phone')->count(),
            'person_conflicts' => DuplicateSeatRecord::when($eventId, fn($q, $eid) => $q->where('event_id', $eid))
                ->where('conflict_type', 'person')->count(),
            'seat_conflicts' => DuplicateSeatRecord::when($eventId, fn($q, $eid) => $q->where('event_id', $eid))
                ->where('conflict_type', 'seat')->count(),
        ];

        return Inertia::render('Admin/DuplicateSeats/Index', [
            'events' => $events,
            'filters' => $request->only(['event_id', 'status', 'conflict_type', 'assigned_to']),
            'records' => $records,
            'users' => $users,
            'stats' => $stats,
            'statuses' => DuplicateSeatRecord::STATUSES,
            'conflict_types' => DuplicateSeatRecord::CONFLICT_TYPES,
        ]);
    }

    public function resolve(Request $request, DuplicateSeatRecord $duplicate)
    {
        $validated = $request->validate([
            'action' => [
                'required',
                'in:processing,resolved_keep_first,resolved_keep_last,resolved_merge,resolved_cancel_all,resolved_manual,close,assign',
            ],
            'resolution_note' => ['nullable', 'string'],
            'final_registration_id' => [
                'nullable',
                'exists:registrations,id',
            ],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'cancel_other' => ['nullable', 'boolean'],
        ]);

        DB::beginTransaction();
        try {
            if ($validated['action'] === 'assign') {
                $duplicate->update([
                    'assigned_to' => $validated['assigned_to'],
                    'status' => 'processing',
                ]);

                NotificationRecord::create([
                    'event_id' => $duplicate->event_id,
                    'type' => 'todo',
                    'title' => '重复占座待办指派',
                    'content' => "您有一个重复占座待处理：{$duplicate->conflict_reason}",
                    'notifiable_type' => \App\Models\User::class,
                    'notifiable_id' => $validated['assigned_to'],
                    'related_id' => $duplicate->id,
                    'related_type' => DuplicateSeatRecord::class,
                    'sent_at' => now(),
                    'created_by' => auth()->id(),
                ]);

                DB::commit();
                return redirect()->back()->with('success', '待办已指派处理人');
            }

            if ($validated['action'] === 'processing') {
                $duplicate->update([
                    'status' => 'processing',
                    'resolution_note' => $validated['resolution_note'] ?? $duplicate->resolution_note,
                ]);
                DB::commit();
                return redirect()->back()->with('success', '已标记为处理中');
            }

            if ($validated['action'] === 'resolved_cancel_all') {
                foreach ($duplicate->conflict_registration_ids as $rid) {
                    $reg = Registration::find($rid);
                    if ($reg && $reg->registration_status !== 'cancelled') {
                        $reg->update([
                            'registration_status' => 'cancelled',
                            'updated_by' => auth()->id(),
                        ]);
                    }
                }
                $duplicate->update([
                    'status' => 'resolved_cancel_all',
                    'resolution_note' => $validated['resolution_note'] ?? '全部取消处理',
                    'resolved_at' => now(),
                    'resolved_by' => auth()->id(),
                ]);
                DB::commit();
                return redirect()->back()->with('success', '已取消全部冲突报名');
            }

            if ($validated['action'] === 'close') {
                $duplicate->update([
                    'status' => 'closed',
                    'resolution_note' => $validated['resolution_note'] ?? '关闭',
                    'resolved_at' => now(),
                    'resolved_by' => auth()->id(),
                ]);
                DB::commit();
                return redirect()->back()->with('success', '已关闭待办');
            }

            if (in_array($validated['action'], ['resolved_keep_first', 'resolved_keep_last', 'resolved_merge', 'resolved_manual'])) {
                $keepId = $validated['final_registration_id'];
                $others = array_filter($duplicate->conflict_registration_ids, fn($id) => $id != $keepId);

                foreach ($others as $rid) {
                    $reg = Registration::find($rid);
                    if ($reg) {
                        if (!empty($validated['cancel_other'])) {
                            $reg->update([
                                'registration_status' => 'cancelled',
                                'conversion_stage' => 'lost',
                                'cancelled_at' => now(),
                                'updated_by' => auth()->id(),
                            ]);
                        }
                    }
                }

                $finalReg = Registration::find($keepId);
                if ($finalReg && $finalReg->registration_status === 'pending') {
                    $finalReg->update([
                        'registration_status' => 'approved',
                        'approved_at' => now(),
                        'approved_by' => auth()->id(),
                    ]);
                }

                $finalNo = $finalReg?->registration_no ?? '';
                $duplicate->update([
                    'status' => $validated['action'],
                    'final_registration_id' => $keepId,
                    'resolution_note' => $validated['resolution_note'] ?? "保留报名 #{$finalNo}",
                    'resolved_at' => now(),
                    'resolved_by' => auth()->id(),
                ]);

                $this->summaryService->refreshAllSummaries($duplicate->event_id);

                DB::commit();
                return redirect()->back()->with('success', '冲突处理成功，已保留指定报名');
            }

            DB::commit();
            return redirect()->back();
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', '处理失败: ' . $e->getMessage());
        }
    }

    public function attendanceRate(Request $request)
    {
        $eventId = $request->input('event_id');
        $events = Event::orderBy('start_time', 'desc')->get(['id', 'name', 'start_time', 'expected_count']);

        $selectedEvent = $eventId ? Event::find($eventId) : ($events->first() ? Event::find($events->first()->id) : null);

        if (!$selectedEvent) {
            return Inertia::render('Admin/DuplicateSeats/AttendanceRate', [
                'events' => $events,
                'selectedEvent' => null,
                'overall_stats' => [],
                'session_details' => [],
                'trend_data' => [],
                'zone_stats' => [],
                'hourly_distribution' => [],
            ]);
        }

        $selectedEvent = Event::with([
            'sessions' => function ($q) {
                $q->withCount(['registrationPivots as registered_count'])
                    ->withCount(['registrationPivots as arrived_count' => function ($q) {
                        $q->where('attendance_status', 'arrived');
                    }])
                    ->withCount(['registrationPivots as no_show_count' => function ($q) {
                        $q->where('attendance_status', 'no_show');
                    }]);
            },
        ])->find($selectedEvent->id);

        $sessions = $selectedEvent->sessions->map(function ($s) {
            $capacity = $s->seat_count ?: $s->capacity;
            $registered = $s->registered_count ?? 0;
            $arrived = $s->arrived_count ?? 0;
            $noShow = $s->no_show_count ?? 0;
            $confirmed = $registered;
            $attendanceRate = $confirmed > 0 ? round($arrived / $confirmed, 4) : 0;
            $arrivalRate = $capacity > 0 ? round($arrived / $capacity, 4) : 0;
            $utilization = $capacity > 0 ? round($registered / $capacity, 4) : 0;

            return [
                'id' => $s->id,
                'name' => $s->name,
                'venue' => $s->venue,
                'start_time' => $s->start_time?->toDateTimeString(),
                'capacity' => $capacity,
                'registered' => $registered,
                'confirmed' => $confirmed,
                'arrived' => $arrived,
                'no_show' => $noShow,
                'attendance_rate' => $attendanceRate,
                'arrival_rate' => $arrivalRate,
                'seat_utilization' => $utilization,
                'seat_vacancies' => max(0, $capacity - $arrived),
            ];
        });

        $totalCapacity = $sessions->sum('capacity');
        $totalRegistered = $sessions->sum('registered');
        $totalArrived = $sessions->sum('arrived');
        $totalNoShow = $sessions->sum('no_show');
        $overallAttendance = $totalRegistered > 0 ? round($totalArrived / $totalRegistered, 4) : 0;
        $overallArrival = $totalCapacity > 0 ? round($totalArrived / $totalCapacity, 4) : 0;
        $overallUtilization = $totalCapacity > 0 ? round($totalRegistered / $totalCapacity, 4) : 0;

        $overallStats = [
            'total_capacity' => $totalCapacity,
            'total_registered' => $totalRegistered,
            'total_arrived' => $totalArrived,
            'total_no_show' => $totalNoShow,
            'total_confirmed' => $totalRegistered,
            'attendance_rate' => $overallAttendance,
            'arrival_rate' => $overallArrival,
            'seat_utilization' => $overallUtilization,
            'seat_vacancies' => max(0, $totalCapacity - $totalArrived),
            'no_show_rate' => $totalRegistered > 0 ? round($totalNoShow / $totalRegistered, 4) : 0,
            'registered_total_loss_rate' => $totalCapacity > 0 ? round(($totalCapacity - $totalRegistered) / $totalCapacity, 4) : 0,
        ];

        $zoneStats = EventSeat::where('event_id', $selectedEvent->id)
            ->select(
                'zone',
                DB::raw('count(*) as total_seats'),
                DB::raw("SUM(CASE WHEN status IN ('sold','reserved') THEN 1 ELSE 0 END) as sold_seats")
            )
            ->groupBy('zone')
            ->orderBy('zone')
            ->get()
            ->map(fn($z) => [
                'zone' => $z->zone ?: '未分区域',
                'total_seats' => (int) $z->total_seats,
                'sold_seats' => (int) $z->sold_seats,
                'occupancy_rate' => $z->total_seats > 0 ? round($z->sold_seats / $z->total_seats, 4) : 0,
            ]);

        $startDate = $selectedEvent->created_at?->startOfDay() ?? now()->subDays(30)->startOfDay();
        $trendData = [];
        $days = min(14, $startDate->diffInDays(now()));
        for ($i = 0; $i < $days; $i++) {
            $date = $startDate->copy()->addDays($i);
            $dateStr = $date->toDateString();

            $summary = AttendanceSummary::where('event_id', $selectedEvent->id)
                ->where('summary_date', $dateStr)
                ->first();

            $trendData[] = [
                'date' => $dateStr,
                'registered' => $summary?->registered_count ?? 0,
                'confirmed' => $summary?->confirmed_count ?? 0,
                'arrived' => $summary?->arrived_count ?? 0,
                'no_show' => $summary?->no_show_count ?? 0,
                'attendance_rate' => round(($summary?->attendance_rate ?? 0) * 100, 2),
                'arrival_rate' => round(($summary?->arrival_rate ?? 0) * 100, 2),
            ];
        }

        return Inertia::render('Admin/DuplicateSeats/AttendanceRate', [
            'events' => $events,
            'selectedEvent' => $selectedEvent ? [
                'id' => $selectedEvent->id,
                'name' => $selectedEvent->name,
            ] : null,
            'overall_stats' => $overallStats,
            'session_details' => $sessions->toArray(),
            'trend_data' => $trendData,
            'zone_stats' => $zoneStats,
            'hourly_distribution' => $this->getHourlyDistribution($selectedEvent->id),
        ]);
    }

    protected function getHourlyDistribution(int $eventId): array
    {
        $data = RegistrationSessionPivot::whereHas('session', function ($q) use ($eventId) {
            $q->where('event_id', $eventId);
        })
            ->whereNotNull('checked_in_at')
            ->select(
                DB::raw('HOUR(checked_in_at) as hour'),
                DB::raw('count(*) as count')
            )
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->mapWithKeys(fn($d) => [$d->hour => (int) $d->count])
            ->toArray();

        $result = [];
        for ($h = 7; $h <= 20; $h++) {
            $result[] = [
                'hour' => sprintf('%02d:00', $h),
                'count' => $data[$h] ?? 0,
            ];
        }

        return $result;
    }
}
