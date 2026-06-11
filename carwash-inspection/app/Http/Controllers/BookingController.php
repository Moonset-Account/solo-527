<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBookingRequest;
use App\Models\ServiceItem;
use App\Models\StatusTimeline;
use App\Models\Vehicle;
use App\Models\WorkOrder;
use Illuminate\Support\Facades\Auth;
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
        DB::transaction(function () use ($request) {
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
            ]);

            StatusTimeline::create([
                'work_order_id' => $order->id,
                'from_status' => '',
                'to_status' => 'pending',
                'handler_id' => Auth::id(),
                'handler_name' => Auth::user()->name ?? 'Customer',
                'remarks' => 'Customer booking',
                'created_at' => now(),
            ]);
        });

        return redirect()->route('booking.create')->with('success', 'Booking submitted successfully.');
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
