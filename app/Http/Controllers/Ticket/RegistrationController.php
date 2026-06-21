<?php

namespace App\Http\Controllers\Ticket;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Registration;
use App\Models\TicketType;
use App\Models\EventSession;
use App\Models\RegistrationSessionPivot;
use App\Models\DuplicateSeatRecord;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class RegistrationController extends Controller
{
    public function index(Request $request)
    {
        $eventId = $request->input('event_id');
        $query = Registration::with(['event', 'ticketType', 'qualityScore', 'creator', 'owner']);

        if ($eventId) {
            $query->where('event_id', $eventId);
        }

        if ($keyword = $request->input('keyword')) {
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                    ->orWhere('phone', 'like', "%{$keyword}%")
                    ->orWhere('company', 'like', "%{$keyword}%")
                    ->orWhere('registration_no', 'like', "%{$keyword}%");
            });
        }

        if ($stage = $request->input('conversion_stage')) {
            $query->where('conversion_stage', $stage);
        }

        if ($status = $request->input('registration_status')) {
            $query->where('registration_status', $status);
        }

        if ($attendance = $request->input('attendance_status')) {
            $query->where('attendance_status', $attendance);
        }

        if ($quality = $request->input('quality_level')) {
            $query->whereHas('qualityScore', fn($q) => $q->where('quality_level', $quality));
        }

        if (!auth()->user()->isManager()) {
            $query->where('created_by', auth()->id());
        }

        $perPage = $request->input('per_page', 20);
        $registrations = $query->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function ($reg) {
                return [
                    'id' => $reg->id,
                    'registration_no' => $reg->registration_no,
                    'name' => $reg->name,
                    'phone' => $reg->phone,
                    'company' => $reg->company,
                    'position' => $reg->position,
                    'source_channel' => $reg->source_channel,
                    'conversion_stage' => $reg->conversion_stage,
                    'conversion_stage_text' => $reg->conversion_stage_text,
                    'registration_status' => $reg->registration_status,
                    'registration_status_text' => $reg->registration_status_text,
                    'attendance_status' => $reg->attendance_status,
                    'attendance_status_text' => $reg->attendance_status_text,
                    'paid_amount' => $reg->paid_amount,
                    'quality_level' => $reg->qualityScore?->level_label,
                    'quality_color' => $reg->qualityScore?->level_color,
                    'total_score' => $reg->qualityScore?->total_score,
                    'event_name' => $reg->event?->name,
                    'creator_name' => $reg->creator?->name,
                    'owner_name' => $reg->owner?->name,
                    'created_at' => $reg->created_at?->toDateTimeString(),
                ];
            });

        $events = Event::orderBy('start_time', 'desc')
            ->limit(20)
            ->get(['id', 'name']);

        return Inertia::render('Ticket/Registrations/Index', [
            'filters' => $request->only(['event_id', 'keyword', 'conversion_stage', 'registration_status', 'attendance_status', 'quality_level']),
            'registrations' => $registrations,
            'events' => $events,
            'conversion_stages' => Registration::CONVERSION_STAGES,
            'registration_statuses' => Registration::REGISTRATION_STATUSES,
            'attendance_statuses' => Registration::ATTENDANCE_STATUSES,
            'quality_levels' => collect(RegistrationQualityScore::QUALITY_LEVELS)->map(fn($v) => $v['label'])->toArray(),
            'canCreate' => auth()->user()->isTicketOperator(),
        ]);
    }

    public function create(Request $request)
    {
        $eventId = $request->input('event_id');
        $events = Event::whereIn('status', ['registering', 'ongoing'])
            ->orderBy('start_time', 'desc')
            ->get(['id', 'name']);

        $ticketTypes = $eventId ? TicketType::where('event_id', $eventId)
            ->where('is_active', true)
            ->get(['id', 'name', 'price']) : collect();

        $sessions = $eventId ? EventSession::where('event_id', $eventId)
            ->where('is_active', true)
            ->orderBy('start_time')
            ->get(['id', 'name', 'start_time', 'end_time']) : collect();

        return Inertia::render('Ticket/Registrations/Create', [
            'events' => $events,
            'ticket_types' => $ticketTypes,
            'sessions' => $sessions,
            'default_event_id' => $eventId,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'event_id' => ['required', 'exists:events,id'],
            'ticket_type_id' => ['nullable', 'exists:ticket_types,id'],
            'name' => ['required', 'string', 'max:100'],
            'gender' => ['nullable', 'string', 'max:10'],
            'phone' => ['required', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:200'],
            'company' => ['nullable', 'string', 'max:200'],
            'industry' => ['nullable', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:100'],
            'position' => ['nullable', 'string', 'max:100'],
            'wechat' => ['nullable', 'string', 'max:100'],
            'id_card' => ['nullable', 'string', 'max:50'],
            'employee_no' => ['nullable', 'string', 'max:50'],
            'source_channel' => ['nullable', 'string', 'max:100'],
            'source_detail' => ['nullable', 'string', 'max:200'],
            'dietary_requirement' => ['nullable', 'string'],
            'remark' => ['nullable', 'string'],
            'conversion_stage' => ['nullable', Rule::in(array_keys(Registration::CONVERSION_STAGES))],
            'registration_status' => ['nullable', Rule::in(array_keys(Registration::REGISTRATION_STATUSES))],
            'paid_amount' => ['nullable', 'numeric', 'min:0'],
            'paid_at' => ['nullable', 'date'],
            'owner_id' => ['nullable', 'exists:users,id'],
            'session_ids' => ['nullable', 'array'],
            'session_ids.*' => ['exists:event_sessions,id'],
            'custom_fields' => ['nullable', 'array'],
        ]);

        $validated['created_by'] = auth()->id();
        $validated['conversion_stage'] = $validated['conversion_stage'] ?? 'registered';
        $validated['registration_status'] = $validated['registration_status'] ?? 'pending';

        if (!empty($validated['paid_amount']) && $validated['paid_amount'] > 0) {
            $validated['conversion_stage'] = 'paid';
        }

        $sessionIds = $validated['session_ids'] ?? [];
        unset($validated['session_ids']);

        $registration = Registration::create($validated);

        foreach ($sessionIds as $sessionId) {
            RegistrationSessionPivot::create([
                'registration_id' => $registration->id,
                'session_id' => $sessionId,
                'created_by' => auth()->id(),
            ]);
        }

        return redirect()
            ->route('ticket.registrations.show', $registration->id)
            ->with('success', '报名资料提交成功');
    }

    public function show(Registration $registration)
    {
        $registration->load([
            'event', 'ticketType', 'owner', 'creator', 'approver',
            'sessions', 'qualityScore', 'refundRequests',
            'attendanceFeedbacks',
        ]);

        $duplicates = DuplicateSeatRecord::whereJsonContains('conflict_registration_ids', (string) $registration->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($d) => [
                'id' => $d->id,
                'status' => $d->status,
                'status_text' => DuplicateSeatRecord::STATUSES[$d->status] ?? $d->status,
                'conflict_type' => $d->conflict_type,
                'conflict_type_text' => DuplicateSeatRecord::CONFLICT_TYPES[$d->conflict_type] ?? $d->conflict_type,
                'conflict_reason' => $d->conflict_reason,
                'created_at' => $d->created_at?->toDateTimeString(),
            ]);

        $sessionPivots = $registration->sessionPivots->load('session', 'seat')->map(fn($p) => [
            'id' => $p->id,
            'session_id' => $p->session_id,
            'session_name' => $p->session?->name,
            'seat_id' => $p->seat_id,
            'seat_no' => $p->seat ? "{$p->seat->zone}{$p->seat->row}排{$p->seat->seat_no}号" : null,
            'attendance_status' => $p->attendance_status,
            'checked_in_at' => $p->checked_in_at?->toDateTimeString(),
            'check_in_method' => $p->check_in_method,
        ]);

        return Inertia::render('Ticket/Registrations/Show', [
            'registration' => [
                'id' => $registration->id,
                'registration_no' => $registration->registration_no,
                'name' => $registration->name,
                'gender' => $registration->gender,
                'phone' => $registration->phone,
                'email' => $registration->email,
                'company' => $registration->company,
                'industry' => $registration->industry,
                'department' => $registration->department,
                'position' => $registration->position,
                'wechat' => $registration->wechat,
                'id_card' => $registration->id_card,
                'employee_no' => $registration->employee_no,
                'source_channel' => $registration->source_channel,
                'source_detail' => $registration->source_detail,
                'dietary_requirement' => $registration->dietary_requirement,
                'remark' => $registration->remark,
                'custom_fields' => $registration->custom_fields,
                'event_id' => $registration->event_id,
                'event_name' => $registration->event?->name,
                'ticket_type_id' => $registration->ticket_type_id,
                'ticket_type_name' => $registration->ticketType?->name,
                'paid_amount' => $registration->paid_amount,
                'payment_method' => $registration->payment_method,
                'payment_no' => $registration->payment_no,
                'paid_at' => $registration->paid_at?->toDateTimeString(),
                'conversion_stage' => $registration->conversion_stage,
                'conversion_stage_text' => $registration->conversion_stage_text,
                'registration_status' => $registration->registration_status,
                'registration_status_text' => $registration->registration_status_text,
                'attendance_status' => $registration->attendance_status,
                'attendance_status_text' => $registration->attendance_status_text,
                'confirmed_at' => $registration->confirmed_at?->toDateTimeString(),
                'approved_at' => $registration->approved_at?->toDateTimeString(),
                'approver_name' => $registration->approver?->name,
                'creator_name' => $registration->creator?->name,
                'created_at' => $registration->created_at?->toDateTimeString(),
                'owner_name' => $registration->owner?->name,
                'quality_score' => $registration->qualityScore ? [
                    'total_score' => $registration->qualityScore->total_score,
                    'quality_level' => $registration->qualityScore->level_label,
                    'level_color' => $registration->qualityScore->level_color,
                    'is_key_customer' => $registration->qualityScore->is_key_customer,
                    'is_vip' => $registration->qualityScore->is_vip,
                    'information_completeness' => $registration->qualityScore->information_completeness,
                    'position_level_score' => $registration->qualityScore->position_level_score,
                    'company_quality_score' => $registration->qualityScore->company_quality_score,
                    'industry_match_score' => $registration->qualityScore->industry_match_score,
                    'history_score' => $registration->qualityScore->history_score,
                    'score_remark' => $registration->qualityScore->score_remark,
                ] : null,
                'sessions' => $sessionPivots,
                'duplicate_records' => $duplicates,
                'refund_requests' => $registration->refundRequests->map(fn($r) => [
                    'id' => $r->id,
                    'refund_no' => $r->refund_no,
                    'status' => $r->status,
                    'status_text' => $r->status_text,
                    'requested_amount' => $r->requested_amount,
                    'reason' => $r->reason,
                    'created_at' => $r->created_at?->toDateTimeString(),
                ]),
                'feedbacks' => $registration->attendanceFeedbacks->map(fn($f) => [
                    'id' => $f->id,
                    'overall_rating' => $f->overall_rating,
                    'average_rating' => $f->getAverageRating(),
                    'created_at' => $f->created_at?->toDateTimeString(),
                ]),
            ],
            'conversion_stages' => Registration::CONVERSION_STAGES,
            'registration_statuses' => Registration::REGISTRATION_STATUSES,
            'attendance_statuses' => Registration::ATTENDANCE_STATUSES,
            'can_edit' => auth()->user()->isManager() || $registration->created_by === auth()->id(),
        ]);
    }

    public function edit(Registration $registration)
    {
        $registration->load('sessions');
        $events = Event::get(['id', 'name']);
        $ticketTypes = TicketType::where('event_id', $registration->event_id)->get(['id', 'name', 'price']);
        $sessions = EventSession::where('event_id', $registration->event_id)
            ->orderBy('start_time')
            ->get(['id', 'name', 'start_time']);

        return Inertia::render('Ticket/Registrations/Edit', [
            'registration' => $registration->toArray(),
            'events' => $events,
            'ticket_types' => $ticketTypes,
            'sessions' => $sessions,
            'selected_session_ids' => $registration->sessions->pluck('id')->toArray(),
        ]);
    }

    public function update(Request $request, Registration $registration)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'phone' => ['sometimes', 'required', 'string', 'max:20'],
            'email' => ['nullable', 'email'],
            'company' => ['nullable', 'string', 'max:200'],
            'industry' => ['nullable', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:100'],
            'position' => ['nullable', 'string', 'max:100'],
            'wechat' => ['nullable', 'string', 'max:100'],
            'source_channel' => ['nullable', 'string', 'max:100'],
            'remark' => ['nullable', 'string'],
            'conversion_stage' => ['sometimes', Rule::in(array_keys(Registration::CONVERSION_STAGES))],
            'registration_status' => ['sometimes', Rule::in(array_keys(Registration::REGISTRATION_STATUSES))],
            'attendance_status' => ['sometimes', Rule::in(array_keys(Registration::ATTENDANCE_STATUSES))],
            'paid_amount' => ['nullable', 'numeric', 'min:0'],
            'session_ids' => ['nullable', 'array'],
            'session_ids.*' => ['exists:event_sessions,id'],
        ]);

        $validated['updated_by'] = auth()->id();

        if (isset($validated['attendance_status']) && $validated['attendance_status'] === 'arrived' && $registration->attendance_status !== 'arrived') {
            $validated['confirmed_at'] = now();
        }

        if (isset($validated['registration_status']) && $validated['registration_status'] === 'approved' && !$registration->approved_at) {
            $validated['approved_at'] = now();
            $validated['approved_by'] = auth()->id();
        }

        $sessionIds = $validated['session_ids'] ?? null;
        unset($validated['session_ids']);

        $registration->update($validated);

        if ($sessionIds !== null) {
            $registration->sessions()->sync($sessionIds);
            foreach ($sessionIds as $sessionId) {
                RegistrationSessionPivot::updateOrCreate(
                    ['registration_id' => $registration->id, 'session_id' => $sessionId],
                    ['created_by' => auth()->id()]
                );
            }
            $registration->sessionPivots()->whereNotIn('session_id', $sessionIds)->delete();
        }

        return redirect()
            ->route('ticket.registrations.show', $registration->id)
            ->with('success', '报名信息更新成功');
    }
}
