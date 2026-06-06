<?php

namespace App\Http\Controllers\Api\Visitor;

use App\Http\Controllers\Controller;
use App\Services\BookingService;
use App\Services\PaymentService;
use App\Models\Booking;
use App\Models\ParkingSpot;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BookingController extends Controller
{
    public function __construct(
        protected BookingService $bookingService,
        protected PaymentService $paymentService
    ) {}

    public function checkAvailability(Request $request): JsonResponse
    {
        $request->validate([
            'spot_id' => 'required|exists:parking_spots,id',
            'start_time' => 'required|date|after:now',
            'end_time' => 'required|date|after:start_time',
        ]);

        $spotId = $request->input('spot_id');
        $startTime = Carbon::parse($request->input('start_time'));
        $endTime = Carbon::parse($request->input('end_time'));

        $hasConflict = $this->bookingService->checkTimeConflict($spotId, $startTime, $endTime);
        $isLocked = $this->bookingService->isSpotLocked($spotId, $startTime, $endTime);

        return response()->json([
            'available' => !$hasConflict && !$isLocked,
            'has_conflict' => $hasConflict,
            'is_locked' => $isLocked,
            'conflicting_bookings' => $hasConflict ? $this->bookingService->getConflictingBookings($spotId, $startTime, $endTime) : [],
        ]);
    }

    public function lockSpot(Request $request): JsonResponse
    {
        $request->validate([
            'spot_id' => 'required|exists:parking_spots,id',
            'start_time' => 'required|date|after:now',
            'end_time' => 'required|date|after:start_time',
        ]);

        $spotId = $request->input('spot_id');
        $startTime = Carbon::parse($request->input('start_time'));
        $endTime = Carbon::parse($request->input('end_time'));

        if ($this->bookingService->checkTimeConflict($spotId, $startTime, $endTime)) {
            return response()->json(['message' => '该时段已被预约'], 409);
        }

        $lockKey = $this->bookingService->lockSpot($spotId, $startTime, $endTime, $request->user()->id);

        if (!$lockKey) {
            return response()->json(['message' => '该时段暂不可用，请稍后重试'], 409);
        }

        return response()->json([
            'lock_key' => $lockKey,
            'expires_at' => time() + BookingService::LOCK_TTL,
        ]);
    }

    public function create(Request $request): JsonResponse
    {
        $request->validate([
            'spot_id' => 'required|exists:parking_spots,id',
            'license_plate' => 'required|string|max:20',
            'start_time' => 'required|date|after:now',
            'end_time' => 'required|date|after:start_time',
            'lock_key' => 'nullable|string',
        ]);

        try {
            $data = $request->only(['spot_id', 'license_plate', 'start_time', 'end_time', 'lock_key']);
            $data['visitor_id'] = $request->user()->id;

            $booking = $this->bookingService->createBooking($data);

            return response()->json([
                'message' => '预约创建成功',
                'booking' => $booking->load('spot', 'dailySplits'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function myBookings(Request $request): JsonResponse
    {
        $status = $request->input('status');

        $bookings = Booking::where('visitor_id', $request->user()->id)
            ->when($status, function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->with(['spot', 'dailySplits', 'payments'])
            ->orderByDesc('created_at')
            ->paginate(15);

        return response()->json($bookings);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $booking = Booking::where('visitor_id', $request->user()->id)
            ->with(['spot', 'dailySplits', 'payments', 'entryRecords'])
            ->findOrFail($id);

        return response()->json($booking);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $booking = Booking::where('visitor_id', $request->user()->id)
            ->findOrFail($id);

        try {
            $reason = $request->input('reason', '用户取消');
            $booking = $this->bookingService->cancelBooking($booking, $reason);

            return response()->json([
                'message' => '订单已取消',
                'booking' => $booking,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function pay(Request $request, int $id): JsonResponse
    {
        $booking = Booking::where('visitor_id', $request->user()->id)
            ->findOrFail($id);

        $request->validate([
            'method' => 'required|in:wechat,alipay,cash,card,balance',
        ]);

        try {
            $payment = $this->paymentService->createPayment($booking, $request->input('method'));

            return response()->json([
                'message' => '支付创建成功',
                'payment' => $payment,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}
