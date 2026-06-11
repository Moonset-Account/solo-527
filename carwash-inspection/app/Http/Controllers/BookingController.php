<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBookingRequest;
use App\Models\ApiFailureLog;
use App\Models\ServiceItem;
use App\Models\StatusTimeline;
use App\Models\Vehicle;
use App\Models\WorkOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BookingController extends Controller
{
    public function create()
    {
        $services = ServiceItem::where('is_active', true)->get();

        $availableSlots = $this->getAvailableTimeSlots();

        return Inertia::render('Booking/Create', [
            'services' => $services,
            'available_slots' => $availableSlots,
        ]);
    }

    public function store(StoreBookingRequest $request)
    {
        $order = DB::transaction(function () use ($request) {
            $vehicle = Vehicle::firstOrCreate(
                ['plate_number' => $request->plate_number],
                [
                    'make' => $request->make,
                    'model' => $request->model,
                    'year' => $request->year,
                    'color' => $request->color,
                    'owner_name' => $request->owner_name,
                    'owner_phone' => $request->owner_phone,
                ]
            );

            $serviceItem = ServiceItem::find($request->service_item_id);

            $order = WorkOrder::create([
                'order_no' => 'WO-' . now()->format('YmdHis') . '-' . str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT),
                'vehicle_id' => $vehicle->id,
                'service_item_id' => $request->service_item_id,
                'status' => 'pending',
                'scheduled_time' => $request->scheduled_time,
                'total_amount' => $serviceItem->price,
                'payment_method' => $request->payment_method,
                'payment_status' => 'unpaid',
            ]);

            StatusTimeline::create([
                'work_order_id' => $order->id,
                'from_status' => '',
                'to_status' => 'pending',
                'handler_id' => null,
                'handler_name' => '客户自助预约',
                'remarks' => '客户在线预约',
                'created_at' => now(),
            ]);

            return $order;
        });

        return redirect()->route('booking.pay', ['order' => $order->id]);
    }

    public function pay(WorkOrder $order)
    {
        $order->load('vehicle', 'serviceItem');

        return Inertia::render('Booking/Pay', [
            'order' => $order,
        ]);
    }

    public function confirmPayment(Request $request, WorkOrder $order)
    {
        $request->validate([
            'payment_method' => ['required', 'in:wechat,alipay,cash'],
        ]);

        $paymentMethod = $request->payment_method;

        if ($paymentMethod === 'cash') {
            DB::transaction(function () use ($order, $paymentMethod) {
                $order->update([
                    'payment_method' => $paymentMethod,
                    'payment_status' => 'pending',
                ]);

                StatusTimeline::create([
                    'work_order_id' => $order->id,
                    'from_status' => 'pending',
                    'to_status' => 'confirmed',
                    'handler_id' => null,
                    'handler_name' => '在线支付',
                    'remarks' => '客户选择到店支付',
                    'created_at' => now(),
                ]);

                $order->update(['status' => 'confirmed']);
            });

            return Inertia::render('Booking/PayResult', [
                'success' => true,
                'order' => $order->load('vehicle', 'serviceItem'),
                'message' => '预约确认成功，请到店后支付。',
            ]);
        }

        $paymentSuccess = $this->simulatePaymentApi($paymentMethod, $order);

        if (!$paymentSuccess) {
            ApiFailureLog::create([
                'api_type' => 'payment',
                'channel' => $paymentMethod,
                'order_no' => $order->order_no,
                'error_message' => '支付网关连接超时，请稍后重试',
                'error_code' => 'PAY_TIMEOUT_001',
                'impact_scope' => [
                    'order_id' => $order->id,
                    'order_no' => $order->order_no,
                    'amount' => $order->total_amount,
                    'payment_method' => $paymentMethod,
                ],
                'retry_count' => 0,
                'status' => 'pending',
            ]);

            StatusTimeline::create([
                'work_order_id' => $order->id,
                'from_status' => 'pending',
                'to_status' => 'pending',
                'handler_id' => null,
                'handler_name' => '在线支付',
                'remarks' => '支付失败，等待重试',
                'created_at' => now(),
            ]);

            return Inertia::render('Booking/PayResult', [
                'success' => false,
                'order' => $order->load('vehicle', 'serviceItem'),
                'message' => '支付失败，请稍后重试或选择其他支付方式。',
            ]);
        }

        DB::transaction(function () use ($order, $paymentMethod) {
            $order->update([
                'payment_method' => $paymentMethod,
                'payment_status' => 'paid',
                'paid_amount' => $order->total_amount,
                'payment_paid_at' => now(),
            ]);

            StatusTimeline::create([
                'work_order_id' => $order->id,
                'from_status' => 'pending',
                'to_status' => 'confirmed',
                'handler_id' => null,
                'handler_name' => '在线支付',
                'remarks' => '在线支付成功',
                'created_at' => now(),
            ]);

            $order->update(['status' => 'confirmed']);
        });

        $order->load('vehicle');
        $smsSuccess = $this->simulateSmsApi($order->vehicle->owner_phone, '您的洗车预约已确认，工单号：' . $order->order_no);

        if (!$smsSuccess) {
            ApiFailureLog::create([
                'api_type' => 'sms',
                'channel' => 'aliyun',
                'order_no' => $order->order_no,
                'request_payload' => [
                    'phone' => $order->vehicle->owner_phone,
                    'template' => 'booking_confirmation',
                    'order_no' => $order->order_no,
                ],
                'error_message' => '短信网关响应超时',
                'error_code' => 'SMS_TIMEOUT_002',
                'impact_scope' => [
                    'order_id' => $order->id,
                    'order_no' => $order->order_no,
                    'phone' => $order->vehicle->owner_phone,
                    'sms_type' => 'booking_confirmation',
                ],
                'retry_count' => 0,
                'status' => 'pending',
            ]);
        }

        return Inertia::render('Booking/PayResult', [
            'success' => true,
            'order' => $order->load('vehicle', 'serviceItem'),
            'message' => '支付成功，预约已确认。',
        ]);
    }

    private function simulatePaymentApi(string $channel, WorkOrder $order): bool
    {
        $failureRate = 0.2;

        return mt_rand() / mt_getrandmax() > $failureRate;
    }

    private function simulateSmsApi(string $phone, string $message): bool
    {
        $failureRate = 0.15;

        return mt_rand() / mt_getrandmax() > $failureRate;
    }

    private function getAvailableTimeSlots(): array
    {
        $slots = [];
        $startDate = now()->addDay()->startOfDay();

        for ($i = 0; $i < 7; $i++) {
            $date = $startDate->copy()->addDays($i);
            $daySlots = [];

            for ($hour = 8; $hour <= 18; $hour++) {
                $slotTime = $date->copy()->setHour($hour);
                $existingCount = WorkOrder::whereDate('scheduled_time', $date->toDateString())
                    ->whereTime('scheduled_time', $slotTime->format('H:00:00'))
                    ->count();

                $daySlots[] = [
                    'time' => $slotTime->format('H:00'),
                    'datetime' => $slotTime->toIso8601String(),
                    'available' => $existingCount < 5,
                ];
            }

            $slots[] = [
                'date' => $date->toDateString(),
                'day_name' => $date->format('l'),
                'slots' => $daySlots,
            ];
        }

        return $slots;
    }
}
