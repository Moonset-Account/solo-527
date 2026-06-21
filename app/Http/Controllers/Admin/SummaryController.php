<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Registration;
use App\Models\ConversionSummary;
use App\Models\AttendanceSummary;
use App\Models\RegistrationSessionPivot;
use App\Services\SummaryService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SummaryController extends Controller
{
    protected SummaryService $summaryService;

    public function __construct(SummaryService $summaryService)
    {
        $this->summaryService = $summaryService;
    }

    public function index(Request $request)
    {
        $eventId = $request->input('event_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $events = Event::orderBy('start_time', 'desc')->get(['id', 'name', 'start_time', 'status']);
        $event = $eventId ? Event::find($eventId) : $events->first();
        $selectedEventId = $event?->id;

        if (!$selectedEventId) {
            return Inertia::render('Admin/Summary/Index', [
                'events' => $events,
                'selectedEvent' => null,
                'filters' => $request->only(['event_id', 'start_date', 'end_date']),
                'conversion_summaries' => [],
                'attendance_summaries' => [],
                'conversion_totals' => [],
                'attendance_totals' => [],
            ]);
        }

        $event = Event::with('sessions:id,event_id,name')->find($selectedEventId);

        $conversionQuery = ConversionSummary::where('event_id', $selectedEventId)
            ->when($startDate, fn($q, $sd) => $q->where('summary_date', '>=', $sd))
            ->when($endDate, fn($q, $ed) => $q->where('summary_date', '<=', $ed))
            ->orderBy('summary_date', 'desc');
        $conversionSummaries = (clone $conversionQuery)->limit(60)->get()->reverse()->values();

        $attendanceQuery = AttendanceSummary::where('event_id', $selectedEventId)
            ->when($startDate, fn($q, $sd) => $q->where('summary_date', '>=', $sd))
            ->when($endDate, fn($q, $ed) => $q->where('summary_date', '<=', $ed))
            ->orderBy('summary_date', 'desc');
        $attendanceSummaries = (clone $attendanceQuery)
            ->whereNull('session_id')
            ->limit(60)
            ->get()
            ->reverse()
            ->values();

        $sessionAttendance = (clone $attendanceQuery)
            ->whereNotNull('session_id')
            ->limit(60)
            ->get()
            ->groupBy('session_id')
            ->map->reverse()->values();

        $conversionTotals = [
            'new_inquiry' => $conversionQuery->sum('new_inquiry_count'),
            'new_registered' => $conversionQuery->sum('new_registered_count'),
            'new_confirmed' => $conversionQuery->sum('new_confirmed_count'),
            'new_paid' => $conversionQuery->sum('new_paid_count'),
            'new_lost' => $conversionQuery->sum('new_lost_count'),
            'total_paid_amount' => (float) ConversionSummary::where('event_id', $selectedEventId)
                ->when($endDate, fn($q, $ed) => $q->where('summary_date', '<=', $ed))
                ->latest('summary_date')
                ->value('total_paid_amount') ?? 0,
        ];

        $latestAttendance = AttendanceSummary::where('event_id', $selectedEventId)
            ->whereNull('session_id')
            ->latest('summary_date')
            ->first();

        $attendanceTotals = [
            'registered' => $latestAttendance?->registered_count ?? 0,
            'confirmed' => $latestAttendance?->confirmed_count ?? 0,
            'arrived' => $latestAttendance?->arrived_count ?? 0,
            'no_show' => $latestAttendance?->no_show_count ?? 0,
            'attendance_rate' => $latestAttendance?->attendance_rate ?? 0,
            'arrival_rate' => $latestAttendance?->arrival_rate ?? 0,
            'seat_capacity' => $latestAttendance?->seat_capacity ?? 0,
            'seat_occupied' => $latestAttendance?->seat_occupied ?? 0,
        ];

        return Inertia::render('Admin/Summary/Index', [
            'events' => $events,
            'selectedEvent' => $event ? [
                'id' => $event->id,
                'name' => $event->name,
                'sessions' => $event->sessions->map(fn($s) => ['id' => $s->id, 'name' => $s->name]),
            ] : null,
            'filters' => $request->only(['event_id', 'start_date', 'end_date']),
            'conversion_summaries' => $conversionSummaries,
            'attendance_summaries' => $attendanceSummaries,
            'session_attendance' => $sessionAttendance,
            'conversion_totals' => $conversionTotals,
            'attendance_totals' => $attendanceTotals,
        ]);
    }

    public function updateConversion(Request $request)
    {
        $validated = $request->validate([
            'event_id' => ['required', 'exists:events,id'],
            'summary_date' => ['required', 'date'],
            'new_inquiry_count' => ['nullable', 'integer', 'min:0'],
            'new_registered_count' => ['nullable', 'integer', 'min:0'],
            'new_confirmed_count' => ['nullable', 'integer', 'min:0'],
            'new_paid_count' => ['nullable', 'integer', 'min:0'],
            'new_lost_count' => ['nullable', 'integer', 'min:0'],
        ]);

        $summary = ConversionSummary::updateOrCreate(
            [
                'event_id' => $validated['event_id'],
                'summary_date' => $validated['summary_date'],
            ],
            array_merge(
                array_filter($validated, fn($k) => in_array($k, [
                    'new_inquiry_count', 'new_registered_count', 'new_confirmed_count',
                    'new_paid_count', 'new_lost_count'
                ]), ARRAY_FILTER_USE_KEY),
                ['created_by' => auth()->id()]
            )
        );

        $this->summaryService->calculateDailyConversion($validated['event_id'], $validated['summary_date']);

        return redirect()->back()->with('success', '转化数据更新成功');
    }

    public function updateAttendance(Request $request)
    {
        $validated = $request->validate([
            'registration_id' => ['required', 'exists:registrations,id'],
            'attendance_status' => ['required', 'in:arrived,not_arrived,partial,no_show'],
            'session_id' => ['nullable', 'exists:event_sessions,id'],
        ]);

        $registration = Registration::findOrFail($validated['registration_id']);

        if ($validated['session_id']) {
            $pivot = RegistrationSessionPivot::updateOrCreate(
                ['registration_id' => $registration->id, 'session_id' => $validated['session_id']],
                [
                    'attendance_status' => $validated['attendance_status'],
                    'checked_in_at' => $validated['attendance_status'] === 'arrived' ? now() : null,
                    'checked_in_by' => auth()->id(),
                    'created_by' => auth()->id(),
                ]
            );
        } else {
            $registration->update([
                'attendance_status' => $validated['attendance_status'],
                'updated_by' => auth()->id(),
            ]);
        }

        $this->summaryService->calculateDailyAttendance($registration->event_id, $validated['session_id'] ?? null, now()->toDateString());

        return redirect()->back()->with('success', '到场状态更新成功');
    }

    public function batchUpdateAttendance(Request $request)
    {
        $validated = $request->validate([
            'event_id' => ['required', 'exists:events,id'],
            'attendance_data' => ['required', 'array'],
            'attendance_data.*.registration_id' => ['required', 'exists:registrations,id'],
            'attendance_data.*.status' => ['required', 'in:arrived,not_arrived,partial,no_show'],
            'attendance_data.*.session_id' => ['nullable', 'exists:event_sessions,id'],
        ]);

        $count = 0;
        foreach ($validated['attendance_data'] as $item) {
            $registration = Registration::find($item['registration_id']);
            if (!$registration || $registration->event_id != $validated['event_id']) continue;

            if (!empty($item['session_id'])) {
                RegistrationSessionPivot::updateOrCreate(
                    ['registration_id' => $registration->id, 'session_id' => $item['session_id']],
                    [
                        'attendance_status' => $item['status'],
                        'checked_in_at' => $item['status'] === 'arrived' ? now() : null,
                        'checked_in_by' => auth()->id(),
                        'created_by' => auth()->id(),
                    ]
                );
            } else {
                $registration->update([
                    'attendance_status' => $item['status'],
                    'updated_by' => auth()->id(),
                ]);
            }
            $count++;
        }

        $this->summaryService->refreshAllSummaries($validated['event_id']);

        return redirect()->back()->with('success', "成功批量更新 {$count} 条到场记录");
    }
}
