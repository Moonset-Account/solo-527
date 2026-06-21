<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Registration;
use App\Models\RegistrationSessionPivot;
use App\Services\SummaryService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RegistrationApiController extends Controller
{
    protected SummaryService $summaryService;

    public function __construct(SummaryService $summaryService)
    {
        $this->summaryService = $summaryService;
    }

    public function stats(Request $request): JsonResponse
    {
        $eventId = $request->input('event_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $query = Registration::query();
        if ($eventId) $query->where('event_id', $eventId);
        if ($startDate) $query->whereDate('created_at', '>=', $startDate);
        if ($endDate) $query->whereDate('created_at', '<=', $endDate);

        $stats = [
            'total' => (clone $query)->count(),
            'by_stage' => (clone $query)
                ->selectRaw('conversion_stage, count(*) as count')
                ->groupBy('conversion_stage')
                ->get()
                ->mapWithKeys(fn($r) => [$r->conversion_stage => (int) $r->count])
                ->toArray(),
            'by_registration_status' => (clone $query)
                ->selectRaw('registration_status, count(*) as count')
                ->groupBy('registration_status')
                ->get()
                ->mapWithKeys(fn($r) => [$r->registration_status => (int) $r->count])
                ->toArray(),
            'by_attendance_status' => (clone $query)
                ->selectRaw('attendance_status, count(*) as count')
                ->mapWithKeys(fn($r) => [$r->attendance_status => (int) $r->count])
                ->toArray(),
            'by_source_channel' => (clone $query)
                ->selectRaw('COALESCE(source_channel, "未指定") as channel, count(*) as count')
                ->groupBy('source_channel')
                ->orderBy('count', 'desc')
                ->limit(20)
                ->get()
                ->map(fn($r) => ['channel' => $r->channel, 'count' => (int) $r->count])
                ->toArray(),
            'total_paid_amount' => (clone $query)->sum('paid_amount'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    public function batchStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event_id' => ['required', 'exists:events,id'],
            'registrations' => ['required', 'array', 'min:1', 'max:500'],
            'registrations.*.name' => ['required', 'string', 'max:100'],
            'registrations.*.phone' => ['required', 'string', 'max:20'],
            'registrations.*.company' => ['nullable', 'string', 'max:200'],
            'registrations.*.position' => ['nullable', 'string', 'max:100'],
            'registrations.*.email' => ['nullable', 'email', 'max:200'],
            'registrations.*.industry' => ['nullable', 'string', 'max:100'],
            'registrations.*.conversion_stage' => ['nullable', 'string'],
            'registrations.*.source_channel' => ['nullable', 'string', 'max:100'],
            'registrations.*.session_ids' => ['nullable', 'array'],
            'registrations.*.paid_amount' => ['nullable', 'numeric'],
        ]);

        $eventId = $validated['event_id'];
        $userId = auth()->id();
        $created = 0;
        $failed = 0;
        $errors = [];

        foreach ($validated['registrations'] as $index => $data) {
            try {
                $sessionIds = $data['session_ids'] ?? null;
                unset($data['session_ids']);
                if (!isset($data['conversion_stage'])) {
                    $data['conversion_stage'] = 'registered';
                }

                $data['registration_status'] = $data['registration_status'] ?? 'pending';
                $data['event_id'] = $eventId;
                $data['created_by'] = $userId;

                if (!empty($data['paid_amount'])) {
                    $data['conversion_stage'] = 'paid';
                }

                $registration = Registration::create($data);
                if ($sessionIds) {
                    foreach ($sessionIds as $sid) {
                        RegistrationSessionPivot::create([
                            'registration_id' => $registration->id,
                            'session_id' => $sid,
                            'created_by' => $userId,
                        ]);
                    }
                }
                $created++;
            } catch (\Exception $e) {
                $failed++;
                $errors[] = [
                    'index' => $index,
                    'error' => $e->getMessage(),
                    'data' => $data,
                ];
            }
        }

        if ($created > 0) {
            $this->summaryService->calculateDailyConversion($eventId, now()->toDateString());
        }

        return response()->json([
            'success' => true,
            'created' => $created,
            'failed' => $failed,
            'errors' => $errors,
        ]);
    }
}
