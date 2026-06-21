<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventSession;
use App\Models\EventSeat;
use App\Models\SystemConfig;
use App\Models\RefundRequest;
use App\Models\AttendanceFeedback;
use App\Models\ActivityLog;
use App\Models\Registration;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ConfigController extends Controller
{
    public function index(Request $request)
    {
        $eventId = $request->input('event_id');
        $events = Event::orderBy('start_time', 'desc')->get(['id', 'name']);

        if (!$eventId) {
            $eventId = $events->first()?->id;
        }

        $featureToggles = [
            'enable_online_registration' => SystemConfig::getValue('feature_toggle', 'enable_online_registration', true, $eventId),
            'enable_payment' => SystemConfig::getValue('feature_toggle', 'enable_payment', false, $eventId),
            'enable_auto_check_in' => SystemConfig::getValue('feature_toggle', 'enable_auto_check_in', false, $eventId),
            'enable_auto_score' => SystemConfig::getValue('feature_toggle', 'enable_auto_score', true, $eventId),
            'enable_duplicate_detection' => SystemConfig::getValue('feature_toggle', 'enable_duplicate_detection', true, $eventId),
            'enable_notification' => SystemConfig::getValue('feature_toggle', 'enable_notification', true, $eventId),
            'show_attendance_stats' => SystemConfig::getValue('feature_toggle', 'show_attendance_stats', true, $eventId),
            'allow_self_feedback' => SystemConfig::getValue('feature_toggle', 'allow_self_feedback', false, $eventId),
        ];

        $toggleConfigs = SystemConfig::byGroup('feature_toggle', $eventId)->get()->mapWithKeys(fn($c) => [
            $c->config_key => [
                'title' => $c->title,
                'updated_at' => $c->updated_at?->toDateTimeString(),
                'updated_by' => $c->updater?->name,
            ]
        ]);

        $sessions = [];
        $seats = [];
        if ($eventId) {
            $sessions = EventSession::where('event_id', $eventId)
                ->orderBy('start_time')
                ->withCount('seats')
                ->get()
                ->map(fn($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'venue' => $s->venue,
                    'start_time' => $s->start_time?->toDateTimeString(),
                    'end_time' => $s->end_time?->toDateTimeString(),
                    'speaker' => $s->speaker,
                    'capacity' => $s->capacity,
                    'seat_count' => $s->seat_count,
                    'is_active' => $s->is_active,
                    'sort_order' => $s->sort_order,
                    'seats_count' => $s->seats_count ?? 0,
                    'updated_by' => $s->updater?->name,
                    'updated_at' => $s->updated_at?->toDateTimeString(),
                ]);

            $seats = EventSeat::where('event_id', $eventId)
                ->with('session:id,name')
                ->orderBy('zone')
                ->orderBy('row')
                ->orderBy('seat_no')
                ->limit(200)
                ->get()
                ->map(fn($s) => [
                    'id' => $s->id,
                    'session_id' => $s->session_id,
                    'session_name' => $s->session?->name,
                    'zone' => $s->zone,
                    'row' => $s->row,
                    'seat_no' => $s->seat_no,
                    'display_name' => "{$s->zone}{$s->row}排{$s->seat_no}号",
                    'price' => $s->price,
                    'level' => $s->level,
                    'status' => $s->status,
                    'updated_by' => $s->updater?->name,
                    'updated_at' => $s->updated_at?->toDateTimeString(),
                ]);
        }

        return Inertia::render('Admin/Config/Index', [
            'events' => $events,
            'selectedEventId' => $eventId,
            'feature_toggles' => $featureToggles,
            'toggle_configs' => $toggleConfigs,
            'sessions' => $sessions,
            'seats' => $seats,
        ]);
    }

    public function updateFeatureToggle(Request $request)
    {
        $validated = $request->validate([
            'event_id' => ['nullable', 'exists:events,id'],
            'config_key' => ['required', 'string'],
            'config_value' => ['required'],
            'title' => ['nullable', 'string'],
        ]);

        $value = filter_var($validated['config_value'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        if ($value === null) {
            $value = $validated['config_value'];
        }

        SystemConfig::setValue(
            'feature_toggle',
            $validated['config_key'],
            $value,
            $validated['title'] ?? $validated['config_key'],
            'boolean',
            $validated['event_id'] ?? null,
            auth()->id()
        );

        ActivityLog::create([
            'log_name' => 'system_config',
            'description' => '修改功能开关: ' . ($validated['title'] ?? $validated['config_key']) . ' = ' . ($value ? '开启' : '关闭'),
            'causer_type' => get_class(auth()->user()),
            'causer_id' => auth()->id(),
            'new_values' => [
                'config_key' => $validated['config_key'],
                'config_value' => $value,
                'event_id' => $validated['event_id'] ?? null,
            ],
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'ip' => $request->ip(),
        ]);

        return redirect()->back()->with('success', '配置更新成功');
    }

    public function storeSession(Request $request)
    {
        $validated = $request->validate([
            'event_id' => ['required', 'exists:events,id'],
            'name' => ['required', 'string', 'max:200'],
            'venue' => ['nullable', 'string', 'max:200'],
            'start_time' => ['required', 'date'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'speaker' => ['nullable', 'string', 'max:200'],
            'agenda' => ['nullable', 'string'],
            'capacity' => ['nullable', 'integer', 'min:0'],
            'seat_count' => ['nullable', 'integer', 'min:0'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $validated['created_by'] = auth()->id();

        $session = EventSession::create($validated);

        ActivityLog::create([
            'log_name' => 'event_session',
            'description' => "创建场次: {$session->name}",
            'subject_type' => EventSession::class,
            'subject_id' => $session->id,
            'causer_type' => get_class(auth()->user()),
            'causer_id' => auth()->id(),
            'new_values' => $session->toArray(),
        ]);

        return redirect()->back()->with('success', '场次创建成功');
    }

    public function updateSession(Request $request, EventSession $session)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:200'],
            'venue' => ['nullable', 'string', 'max:200'],
            'start_time' => ['sometimes', 'required', 'date'],
            'end_time' => ['sometimes', 'required', 'date'],
            'speaker' => ['nullable', 'string', 'max:200'],
            'agenda' => ['nullable', 'string'],
            'capacity' => ['nullable', 'integer', 'min:0'],
            'seat_count' => ['nullable', 'integer', 'min:0'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $oldValues = $session->getDirty();
        $validated['updated_by'] = auth()->id();

        $session->update($validated);

        ActivityLog::create([
            'log_name' => 'event_session',
            'description' => "更新场次: {$session->name}",
            'subject_type' => EventSession::class,
            'subject_id' => $session->id,
            'causer_type' => get_class(auth()->user()),
            'causer_id' => auth()->id(),
            'old_values' => $oldValues,
            'new_values' => $validated,
        ]);

        return redirect()->back()->with('success', '场次更新成功');
    }

    public function destroySession(EventSession $session)
    {
        $sessionName = $session->name;
        $session->delete();

        ActivityLog::create([
            'log_name' => 'event_session',
            'description' => "删除场次: {$sessionName}",
            'subject_type' => EventSession::class,
            'subject_id' => $session->id,
            'causer_type' => get_class(auth()->user()),
            'causer_id' => auth()->id(),
        ]);

        return redirect()->back()->with('success', '场次删除成功');
    }

    public function storeSeat(Request $request)
    {
        $validated = $request->validate([
            'event_id' => ['required', 'exists:events,id'],
            'session_id' => ['nullable', 'exists:event_sessions,id'],
            'zone' => ['nullable', 'string', 'max:50'],
            'row' => ['nullable', 'string', 'max:20'],
            'seat_no' => ['required', 'string', 'max:50'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'level' => ['nullable', Rule::in(['normal', 'vip', 'vvip', 'guest'])],
            'status' => ['nullable', Rule::in(['available', 'locked', 'sold', 'reserved', 'disabled'])],
            'remark' => ['nullable', 'string'],
            'batch_count' => ['nullable', 'integer', 'min:1', 'max:500'],
            'batch_start_no' => ['nullable', 'integer', 'min:1'],
        ]);

        $validated['created_by'] = auth()->id();
        $batchCount = $validated['batch_count'] ?? 1;
        $batchStartNo = $validated['batch_start_no'] ?? 1;
        unset($validated['batch_count'], $validated['batch_start_no']);

        $created = 0;
        for ($i = 0; $i < $batchCount; $i++) {
            $seatNo = $batchCount > 1 ? (string) ($batchStartNo + $i) : $validated['seat_no'];
            try {
                EventSeat::create(array_merge($validated, ['seat_no' => $seatNo]));
                $created++;
            } catch (\Exception $e) {
                continue;
            }
        }

        ActivityLog::create([
            'log_name' => 'event_seat',
            'description' => "批量创建座位 {$created} 个",
            'causer_type' => get_class(auth()->user()),
            'causer_id' => auth()->id(),
            'new_values' => array_merge($validated, ['batch_count' => $batchCount, 'created' => $created]),
        ]);

        return redirect()->back()->with('success', "成功创建 {$created} 个座位");
    }

    public function updateSeat(Request $request, EventSeat $seat)
    {
        $validated = $request->validate([
            'zone' => ['nullable', 'string', 'max:50'],
            'row' => ['nullable', 'string', 'max:20'],
            'seat_no' => ['sometimes', 'required', 'string', 'max:50'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'level' => ['nullable', Rule::in(['normal', 'vip', 'vvip', 'guest'])],
            'status' => ['sometimes', 'required', Rule::in(['available', 'locked', 'sold', 'reserved', 'disabled'])],
            'remark' => ['nullable', 'string'],
        ]);

        $oldValues = $seat->toArray();
        $validated['updated_by'] = auth()->id();
        $seat->update($validated);

        ActivityLog::create([
            'log_name' => 'event_seat',
            'description' => "更新座位: {$seat->zone}{$seat->row}排{$seat->seat_no}号",
            'subject_type' => EventSeat::class,
            'subject_id' => $seat->id,
            'causer_type' => get_class(auth()->user()),
            'causer_id' => auth()->id(),
            'old_values' => $oldValues,
            'new_values' => $validated,
        ]);

        return redirect()->back()->with('success', '座位更新成功');
    }

    public function destroySeat(EventSeat $seat)
    {
        $seatInfo = "{$seat->zone}{$seat->row}排{$seat->seat_no}号";
        $seat->delete();

        ActivityLog::create([
            'log_name' => 'event_seat',
            'description' => "删除座位: {$seatInfo}",
            'subject_type' => EventSeat::class,
            'subject_id' => $seat->id,
            'causer_type' => get_class(auth()->user()),
            'causer_id' => auth()->id(),
        ]);

        return redirect()->back()->with('success', '座位删除成功');
    }

    public function refunds(Request $request)
    {
        $eventId = $request->input('event_id');
        $status = $request->input('status');

        $events = Event::orderBy('start_time', 'desc')->get(['id', 'name']);

        $query = RefundRequest::with(['registration:id,registration_no,name,phone,paid_amount', 'event:id,name', 'reviewer:id,name', 'processor:id,name'])
            ->when($eventId, fn($q, $eid) => $q->where('event_id', $eid))
            ->when($status, fn($q, $s) => $q->where('status', $s));

        $refunds = $query->orderBy('created_at', 'desc')
            ->paginate(30)
            ->through(fn($r) => [
                'id' => $r->id,
                'refund_no' => $r->refund_no,
                'registration_no' => $r->registration?->registration_no,
                'registrant_name' => $r->registration?->name,
                'registrant_phone' => $r->registration?->phone,
                'event_name' => $r->event?->name,
                'requested_amount' => $r->requested_amount,
                'actual_amount' => $r->actual_amount,
                'paid_amount' => $r->registration?->paid_amount,
                'reason' => $r->reason,
                'applicant_name' => $r->applicant_name,
                'status' => $r->status,
                'status_text' => $r->status_text,
                'review_note' => $r->review_note,
                'reviewer_name' => $r->reviewer?->name,
                'reviewed_at' => $r->reviewed_at?->toDateTimeString(),
                'processor_name' => $r->processor?->name,
                'completed_at' => $r->completed_at?->toDateTimeString(),
                'creator_name' => $r->creator?->name,
                'created_at' => $r->created_at?->toDateTimeString(),
            ]);

        $stats = [
            'total' => (clone $query)->count(),
            'pending' => (clone $query)->where('status', 'pending')->count(),
            'approved' => (clone $query)->where('status', 'approved')->count(),
            'processing' => (clone $query)->where('status', 'processing')->count(),
            'completed' => (clone $query)->where('status', 'completed')->count(),
            'rejected' => (clone $query)->where('status', 'rejected')->count(),
            'total_amount' => (clone $query)->whereIn('status', ['completed', 'approved', 'processing'])->sum('actual_amount'),
        ];

        return Inertia::render('Admin/Config/Refunds', [
            'events' => $events,
            'filters' => $request->only(['event_id', 'status']),
            'refunds' => $refunds,
            'stats' => $stats,
            'statuses' => RefundRequest::STATUSES,
        ]);
    }

    public function processRefund(Request $request, RefundRequest $refund)
    {
        $validated = $request->validate([
            'action' => ['required', 'in:approve,reject,process,complete'],
            'note' => ['nullable', 'string'],
            'actual_amount' => ['nullable', 'numeric', 'min:0'],
            'refund_method' => ['nullable', 'string'],
        ]);

        $now = now();

        ActivityLog::create([
            'log_name' => 'refund_request',
            'description' => "处理退款申请 #{$refund->refund_no} 动作: {$validated['action']}",
            'subject_type' => RefundRequest::class,
            'subject_id' => $refund->id,
            'causer_type' => get_class(auth()->user()),
            'causer_id' => auth()->id(),
            'old_values' => ['status' => $refund->status],
        ]);

        switch ($validated['action']) {
            case 'approve':
                $refund->update([
                    'status' => 'approved',
                    'review_note' => $validated['note'] ?? $refund->review_note,
                    'actual_amount' => $validated['actual_amount'] ?? $refund->requested_amount,
                    'reviewed_at' => $now,
                    'reviewed_by' => auth()->id(),
                ]);
                break;
            case 'reject':
                $refund->update([
                    'status' => 'rejected',
                    'review_note' => $validated['note'] ?? '审核未通过',
                    'reviewed_at' => $now,
                    'reviewed_by' => auth()->id(),
                ]);
                break;
            case 'process':
                $refund->update([
                    'status' => 'processing',
                    'refund_method' => $validated['refund_method'] ?? $refund->refund_method,
                    'process_note' => $validated['note'],
                    'processed_by' => auth()->id(),
                ]);
                break;
            case 'complete':
                $refund->update([
                    'status' => 'completed',
                    'process_note' => $validated['note'] ?? $refund->process_note,
                    'completed_at' => $now,
                    'processed_by' => auth()->id(),
                ]);
                if ($refund->registration) {
                    $refund->registration->update([
                        'registration_status' => 'refunded',
                        'updated_by' => auth()->id(),
                    ]);
                }
                break;
        }

        ActivityLog::create([
            'log_name' => 'refund_request',
            'description' => "退款申请 #{$refund->refund_no} 状态变更为: {$refund->status}",
            'subject_type' => RefundRequest::class,
            'subject_id' => $refund->id,
            'causer_type' => get_class(auth()->user()),
            'causer_id' => auth()->id(),
            'new_values' => ['status' => $refund->status],
        ]);

        return redirect()->back()->with('success', '退款处理成功');
    }

    public function feedbacks(Request $request)
    {
        $eventId = $request->input('event_id');
        $minRating = $request->input('min_rating');
        $events = Event::orderBy('start_time', 'desc')->get(['id', 'name']);

        $query = AttendanceFeedback::with(['event:id,name', 'session:id,name', 'registration:id,name,company', 'submitter:id,name'])
            ->when($eventId, fn($q, $eid) => $q->where('event_id', $eid))
            ->when($minRating, fn($q, $r) => $q->where('overall_rating', '>=', (int) $r));

        $feedbacks = $query->orderBy('created_at', 'desc')
            ->paginate(30)
            ->through(fn($f) => [
                'id' => $f->id,
                'event_name' => $f->event?->name,
                'session_name' => $f->session?->name,
                'registrant_name' => $f->is_anonymous ? '匿名用户' : ($f->registration?->name ?? '未知'),
                'company' => $f->is_anonymous ? null : $f->registration?->company,
                'overall_rating' => $f->overall_rating,
                'content_rating' => $f->content_rating,
                'venue_rating' => $f->venue_rating,
                'service_rating' => $f->service_rating,
                'organization_rating' => $f->organization_rating,
                'average_rating' => $f->getAverageRating(),
                'content_feedback' => $f->content_feedback,
                'improvement_suggestion' => $f->improvement_suggestion,
                'good_points' => $f->good_points,
                'other_comments' => $f->other_comments,
                'is_willing_next_time' => $f->is_willing_next_time,
                'would_recommend' => $f->would_recommend,
                'is_anonymous' => $f->is_anonymous,
                'submitter_name' => $f->submitter?->name,
                'created_at' => $f->created_at?->toDateTimeString(),
            ]);

        $eventForStats = $eventId;
        $avgRatings = [
            'overall' => round(AttendanceFeedback::when($eventForStats, fn($q, $e) => $q->where('event_id', $e))->avg('overall_rating') ?? 0, 2),
            'content' => round(AttendanceFeedback::when($eventForStats, fn($q, $e) => $q->where('event_id', $e))->avg('content_rating') ?? 0, 2),
            'venue' => round(AttendanceFeedback::when($eventForStats, fn($q, $e) => $q->where('event_id', $e))->avg('venue_rating') ?? 0, 2),
            'service' => round(AttendanceFeedback::when($eventForStats, fn($q, $e) => $q->where('event_id', $e))->avg('service_rating') ?? 0, 2),
            'organization' => round(AttendanceFeedback::when($eventForStats, fn($q, $e) => $q->where('event_id', $e))->avg('organization_rating') ?? 0, 2),
            'willing_rate' => round((AttendanceFeedback::when($eventForStats, fn($q, $e) => $q->where('event_id', $e))->where('is_willing_next_time', true)->count() / max(1, AttendanceFeedback::when($eventForStats, fn($q, $e) => $q->where('event_id', $e))->whereNotNull('is_willing_next_time')->count())) * 100, 1),
            'recommend_rate' => round((AttendanceFeedback::when($eventForStats, fn($q, $e) => $q->where('event_id', $e))->where('would_recommend', true)->count() / max(1, AttendanceFeedback::when($eventForStats, fn($q, $e) => $q->where('event_id', $e))->whereNotNull('would_recommend')->count())) * 100, 1),
        ];

        $stats = [
            'total' => (clone $query)->count(),
            ...$avgRatings,
        ];

        return Inertia::render('Admin/Config/Feedbacks', [
            'events' => $events,
            'filters' => $request->only(['event_id', 'min_rating']),
            'feedbacks' => $feedbacks,
            'stats' => $stats,
        ]);
    }

    public function logs(Request $request)
    {
        $logName = $request->input('log_name');
        $causerId = $request->input('causer_id');
        $keyword = $request->input('keyword');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $query = ActivityLog::query()
            ->when($logName, fn($q, $ln) => $q->where('log_name', $ln))
            ->when($causerId, fn($q, $cid) => $q->where('causer_id', $cid))
            ->when($keyword, fn($q, $kw) => $q->where('description', 'like', "%{$kw}%"))
            ->when($startDate, fn($q, $sd) => $q->whereDate('created_at', '>=', $sd))
            ->when($endDate, fn($q, $ed) => $q->whereDate('created_at', '<=', $ed));

        $logNames = ActivityLog::select('log_name')
            ->distinct()
            ->orderBy('log_name')
            ->pluck('log_name')
            ->filter()
            ->values();

        $causers = \App\Models\User::select('id', 'name', 'department')
            ->orderBy('name')
            ->get();

        $logs = $query->orderBy('created_at', 'desc')
            ->paginate(50)
            ->through(fn($l) => [
                'id' => $l->id,
                'log_name' => $l->log_name,
                'description' => $l->description,
                'subject_type' => class_basename($l->subject_type),
                'subject_id' => $l->subject_id,
                'causer_id' => $l->causer_id,
                'causer_name' => $l->causer_type ? \App\Models\User::find($l->causer_id)?->name : null,
                'event' => $l->event,
                'old_values' => $l->old_values,
                'new_values' => $l->new_values,
                'changes' => $l->changes(),
                'has_changes' => $l->hasChanges(),
                'batch_uuid' => $l->batch_uuid,
                'ip' => $l->ip,
                'method' => $l->method,
                'url' => $l->url,
                'user_agent' => $l->user_agent,
                'created_at' => $l->created_at?->toDateTimeString(),
            ]);

        $stats = [
            'total' => (clone $query)->count(),
            'today' => (clone $query)->whereDate('created_at', now())->count(),
            'this_week' => (clone $query)->where('created_at', '>=', now()->startOfWeek())->count(),
        ];

        return Inertia::render('Admin/Config/Logs', [
            'filters' => $request->only(['log_name', 'causer_id', 'keyword', 'start_date', 'end_date']),
            'logs' => $logs,
            'log_names' => $logNames,
            'causers' => $causers,
            'stats' => $stats,
        ]);
    }
}
