<?php

namespace App\Http\Controllers\Api\Property;

use App\Http\Controllers\Controller;
use App\Services\LicensePlateService;
use App\Services\ViolationService;
use App\Services\SettlementService;
use App\Services\BookingService;
use App\Models\Booking;
use App\Models\ParkingViolation;
use App\Models\EntryRecord;
use App\Models\Settlement;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ManagementController extends Controller
{
    public function __construct(
        protected LicensePlateService $licensePlateService,
        protected ViolationService $violationService,
        protected SettlementService $settlementService,
        protected BookingService $bookingService
    ) {}

    public function plateRecognitionCallback(Request $request): JsonResponse
    {
        $request->validate([
            'license_plate' => 'nullable|string',
            'confidence' => 'nullable|numeric',
            'device_id' => 'nullable|string',
            'image_url' => 'nullable|string',
            'timestamp' => 'nullable|date',
            'type' => 'required|in:entry,exit',
            'spot_id' => 'nullable|exists:parking_spots,id',
        ]);

        try {
            $record = $this->licensePlateService->handleRecognitionCallback($request->all());

            return response()->json([
                'message' => '识别记录已保存',
                'record' => $record,
                'needs_manual_correction' => (bool) $record->remark,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function manualEntry(Request $request): JsonResponse
    {
        $request->validate([
            'license_plate' => 'required|string|max:20',
            'spot_id' => 'nullable|exists:parking_spots,id',
            'type' => 'required|in:entry,exit',
            'occurred_at' => 'nullable|date',
            'is_manual_release' => 'boolean',
            'release_reason' => 'nullable|string',
            'remark' => 'nullable|string',
        ]);

        try {
            $record = $this->licensePlateService->manualEntry(
                $request->all(),
                $request->user()->id
            );

            return response()->json([
                'message' => '记录创建成功',
                'record' => $record,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function correctEntry(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'license_plate' => 'required|string|max:20',
            'remark' => 'nullable|string',
        ]);

        try {
            $record = $this->licensePlateService->correctEntry(
                $id,
                $request->all(),
                $request->user()->id
            );

            return response()->json([
                'message' => '记录已修正',
                'record' => $record,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function manualRelease(Request $request): JsonResponse
    {
        $request->validate([
            'license_plate' => 'required|string|max:20',
            'spot_id' => 'nullable|exists:parking_spots,id',
            'type' => 'required|in:entry,exit',
            'release_reason' => 'required|string',
            'remark' => 'nullable|string',
        ]);

        try {
            $record = $this->licensePlateService->manualRelease(
                $request->all(),
                $request->user()->id
            );

            return response()->json([
                'message' => '人工放行成功',
                'record' => $record,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function getBookings(Request $request): JsonResponse
    {
        $status = $request->input('status');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $spotId = $request->input('spot_id');
        $licensePlate = $request->input('license_plate');

        $bookings = Booking::with(['spot', 'visitor', 'payments', 'entryRecords'])
            ->when($status, function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->when($startDate, function ($q) use ($startDate) {
                $q->where('start_time', '>=', Carbon::parse($startDate));
            })
            ->when($endDate, function ($q) use ($endDate) {
                $q->where('end_time', '<=', Carbon::parse($endDate));
            })
            ->when($spotId, function ($q) use ($spotId) {
                $q->where('spot_id', $spotId);
            })
            ->when($licensePlate, function ($q) use ($licensePlate) {
                $q->where('license_plate', 'like', "%{$licensePlate}%");
            })
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($bookings);
    }

    public function getEntryRecords(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $type = $request->input('type');
        $isManual = $request->input('is_manual');
        $licensePlate = $request->input('license_plate');

        $records = EntryRecord::with(['booking', 'spot', 'operator'])
            ->when($startDate, function ($q) use ($startDate) {
                $q->where('occurred_at', '>=', Carbon::parse($startDate));
            })
            ->when($endDate, function ($q) use ($endDate) {
                $q->where('occurred_at', '<=', Carbon::parse($endDate));
            })
            ->when($type, function ($q) use ($type) {
                $q->where('type', $type);
            })
            ->when($isManual, function ($q) {
                $q->whereIn('recognition_method', ['manual', 'corrected'])
                    ->orWhere('is_manual_release', true);
            })
            ->when($licensePlate, function ($q) use ($licensePlate) {
                $q->where('license_plate', 'like', "%{$licensePlate}%");
            })
            ->orderByDesc('occurred_at')
            ->paginate(20);

        return response()->json($records);
    }

    public function getManualStats(Request $request): JsonResponse
    {
        $startDate = Carbon::parse($request->input('start_date', '-30 days'));
        $endDate = Carbon::parse($request->input('end_date', 'now'));

        $stats = $this->licensePlateService->getManualRecords($startDate, $endDate);

        return response()->json([
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
            ],
            'summary' => [
                'total' => $stats['total'],
                'manual_entry' => $stats['manual_entry'],
                'corrected' => $stats['corrected'],
                'manual_release' => $stats['manual_release'],
            ],
            'records' => $stats['records'],
        ]);
    }

    public function getViolations(Request $request): JsonResponse
    {
        $status = $request->input('status');
        $hasAppeal = $request->input('has_appeal');
        $licensePlate = $request->input('license_plate');

        $violations = ParkingViolation::with(['spot', 'booking', 'appeals'])
            ->when($status, function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->when($hasAppeal, function ($q) {
                $q->where('has_appeal', true);
            })
            ->when($licensePlate, function ($q) use ($licensePlate) {
                $q->where('license_plate', 'like', "%{$licensePlate}%");
            })
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($violations);
    }

    public function createViolation(Request $request): JsonResponse
    {
        $request->validate([
            'spot_id' => 'required|exists:parking_spots,id',
            'license_plate' => 'required|string|max:20',
            'type' => 'required|in:no_booking,overtime,wrong_spot,unauthorized',
            'booking_id' => 'nullable|exists:bookings,id',
            'violation_time' => 'nullable|date',
            'description' => 'nullable|string',
            'evidence_images' => 'nullable|array',
        ]);

        try {
            $violation = $this->violationService->createViolation($request->all());

            return response()->json([
                'message' => '违停记录创建成功',
                'violation' => $violation,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function confirmViolation(Request $request, int $id): JsonResponse
    {
        $violation = ParkingViolation::findOrFail($id);

        try {
            $violation = $this->violationService->confirmViolation(
                $violation,
                $request->user()->id,
                $request->input('remark', '')
            );

            return response()->json([
                'message' => '违停已确认',
                'violation' => $violation,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function getAppeals(Request $request): JsonResponse
    {
        $status = $request->input('status');

        $appeals = \App\Models\ViolationAppeal::with(['violation', 'appellant', 'reviewer'])
            ->when($status, function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($appeals);
    }

    public function reviewAppeal(Request $request, int $id): JsonResponse
    {
        $appeal = \App\Models\ViolationAppeal::findOrFail($id);

        $request->validate([
            'approved' => 'required|boolean',
            'remark' => 'nullable|string',
            'refund_amount' => 'nullable|numeric|min:0',
        ]);

        try {
            $appeal = $this->violationService->reviewAppeal(
                $appeal,
                $request->input('approved'),
                $request->user()->id,
                $request->input('remark', ''),
                $request->input('refund_amount', 0)
            );

            return response()->json([
                'message' => '申诉审核完成',
                'appeal' => $appeal,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function generateSettlement(Request $request): JsonResponse
    {
        $request->validate([
            'owner_id' => 'required|exists:users,id',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after:period_start',
        ]);

        try {
            $settlement = $this->settlementService->generateSettlement(
                $request->input('owner_id'),
                Carbon::parse($request->input('period_start')),
                Carbon::parse($request->input('period_end'))
            );

            return response()->json([
                'message' => '结算生成成功',
                'settlement' => $settlement,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function getSettlements(Request $request): JsonResponse
    {
        $status = $request->input('status');
        $ownerId = $request->input('owner_id');

        $settlements = Settlement::with(['owner', 'items'])
            ->when($status, function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->when($ownerId, function ($q) use ($ownerId) {
                $q->where('owner_id', $ownerId);
            })
            ->orderByDesc('period_end')
            ->paginate(20);

        return response()->json($settlements);
    }

    public function completeSettlement(Request $request, int $id): JsonResponse
    {
        $settlement = Settlement::findOrFail($id);

        try {
            $settlement = $this->settlementService->completeSettlement($settlement);

            return response()->json([
                'message' => '结算已完成',
                'settlement' => $settlement,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function dashboard(Request $request): JsonResponse
    {
        $today = Carbon::today();
        $startOfMonth = Carbon::today()->startOfMonth();

        $todayBookings = Booking::whereDate('start_time', $today)->count();
        $todayEntries = EntryRecord::whereDate('occurred_at', $today)->count();
        $pendingViolations = ParkingViolation::where('status', 'pending')->count();
        $pendingAppeals = \App\Models\ViolationAppeal::where('status', 'pending')->count();
        $manualInterventions = Booking::whereMonth('created_at', $startOfMonth->month)
            ->sum('manual_intervention_count');
        $monthRevenue = Booking::whereMonth('created_at', $startOfMonth->month)
            ->whereNotIn('status', ['cancelled', 'refunded'])
            ->sum('total_amount');

        return response()->json([
            'today_bookings' => $todayBookings,
            'today_entries' => $todayEntries,
            'pending_violations' => $pendingViolations,
            'pending_appeals' => $pendingAppeals,
            'month_manual_interventions' => $manualInterventions,
            'month_revenue' => $monthRevenue,
        ]);
    }
}
