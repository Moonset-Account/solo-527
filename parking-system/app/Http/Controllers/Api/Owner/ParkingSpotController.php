<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\ParkingSpot;
use App\Models\SpotAvailability;
use App\Services\SettlementService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ParkingSpotController extends Controller
{
    public function __construct(protected SettlementService $settlementService) {}

    public function index(Request $request): JsonResponse
    {
        $spots = ParkingSpot::where('owner_id', $request->user()->id)
            ->withCount(['bookings' => function ($q) {
                $q->whereNotIn('status', ['cancelled', 'refunded']);
            }])
            ->orderByDesc('created_at')
            ->paginate(15);

        return response()->json($spots);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'spot_number' => 'required|string|max:50|unique:parking_spots',
            'location' => 'required|string|max:200',
            'hourly_rate' => 'required|numeric|min:0',
            'daily_rate' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        $spot = ParkingSpot::create(array_merge(
            $request->only(['spot_number', 'location', 'hourly_rate', 'daily_rate', 'description']),
            ['owner_id' => $request->user()->id]
        ));

        return response()->json([
            'message' => '车位创建成功',
            'spot' => $spot,
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $spot = ParkingSpot::where('owner_id', $request->user()->id)
            ->with(['availabilities', 'bookings' => function ($q) {
                $q->whereNotIn('status', ['cancelled', 'refunded'])
                    ->orderByDesc('start_time')
                    ->limit(10);
            }])
            ->findOrFail($id);

        return response()->json($spot);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $spot = ParkingSpot::where('owner_id', $request->user()->id)->findOrFail($id);

        $request->validate([
            'spot_number' => 'string|max:50|unique:parking_spots,spot_number,' . $id,
            'location' => 'string|max:200',
            'hourly_rate' => 'numeric|min:0',
            'daily_rate' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'status' => 'in:active,inactive,maintenance',
        ]);

        $spot->update($request->only(['spot_number', 'location', 'hourly_rate', 'daily_rate', 'description', 'status']));

        return response()->json([
            'message' => '车位更新成功',
            'spot' => $spot,
        ]);
    }

    public function addAvailability(Request $request, int $spotId): JsonResponse
    {
        $spot = ParkingSpot::where('owner_id', $request->user()->id)->findOrFail($spotId);

        $request->validate([
            'start_time' => 'required|date|after:now',
            'end_time' => 'required|date|after:start_time',
            'custom_rate' => 'nullable|numeric|min:0',
            'is_recurring' => 'boolean',
            'recurring_pattern' => 'nullable|string|max:50',
        ]);

        $availability = SpotAvailability::create(array_merge(
            $request->only(['start_time', 'end_time', 'custom_rate', 'is_recurring', 'recurring_pattern']),
            ['spot_id' => $spot->id]
        ));

        return response()->json([
            'message' => '可租时段添加成功',
            'availability' => $availability,
        ], 201);
    }

    public function getBookings(Request $request, int $spotId): JsonResponse
    {
        $spot = ParkingSpot::where('owner_id', $request->user()->id)->findOrFail($spotId);

        $status = $request->input('status');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $bookings = $spot->bookings()
            ->when($status, function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->when($startDate, function ($q) use ($startDate) {
                $q->where('start_time', '>=', Carbon::parse($startDate));
            })
            ->when($endDate, function ($q) use ($endDate) {
                $q->where('end_time', '<=', Carbon::parse($endDate));
            })
            ->with('visitor')
            ->orderByDesc('start_time')
            ->paginate(15);

        return response()->json($bookings);
    }

    public function getSettlementSummary(Request $request): JsonResponse
    {
        $date = Carbon::parse($request->input('date', 'now'));
        $summary = $this->settlementService->getSettlementSummary($request->user()->id, $date);

        return response()->json($summary);
    }

    public function getSettlements(Request $request): JsonResponse
    {
        $settlements = $request->user()->settlements()
            ->with('items')
            ->orderByDesc('period_end')
            ->paginate(15);

        return response()->json($settlements);
    }
}
