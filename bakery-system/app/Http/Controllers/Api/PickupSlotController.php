<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PickupSlot;
use Illuminate\Http\Request;

class PickupSlotController extends Controller
{
    public function index(Request $request)
    {
        $query = PickupSlot::withCount('orders');

        if ($request->filled('date')) {
            $query->where('date', $request->date);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        if ($request->filled('available')) {
            $query->whereColumn('current_orders', '<', 'max_orders');
        }

        if ($request->filled('upcoming')) {
            $query->where('date', '>=', now()->toDateString());
        }

        $slots = $query->orderBy('date')
            ->orderBy('start_time')
            ->paginate($request->get('per_page', 30));

        foreach ($slots as $slot) {
            $slot->is_full = $slot->is_full;
            $slot->available_slots = $slot->available_slots;
        }

        return response()->json($slots);
    }

    public function show(PickupSlot $pickupSlot)
    {
        return response()->json($pickupSlot->load('orders.items.product'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i:s',
            'end_time' => 'required|date_format:H:i:s|after:start_time',
            'max_orders' => 'required|integer|min:1',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $existingSlot = PickupSlot::where('date', $request->date)
            ->where('start_time', $request->start_time)
            ->where('end_time', $request->end_time)
            ->first();

        if ($existingSlot) {
            return response()->json(['message' => '该时段已存在'], 422);
        }

        $slot = PickupSlot::create(array_merge(
            $request->all(),
            ['current_orders' => 0]
        ));

        return response()->json([
            'message' => '取货时段创建成功',
            'slot' => $slot,
        ], 201);
    }

    public function update(Request $request, PickupSlot $pickupSlot)
    {
        $request->validate([
            'date' => 'date',
            'start_time' => 'date_format:H:i:s',
            'end_time' => 'date_format:H:i:s|after:start_time',
            'max_orders' => 'integer|min:' . $pickupSlot->current_orders,
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $pickupSlot->update($request->all());

        return response()->json([
            'message' => '取货时段更新成功',
            'slot' => $pickupSlot,
        ]);
    }

    public function destroy(PickupSlot $pickupSlot)
    {
        if ($pickupSlot->current_orders > 0) {
            return response()->json(['message' => '该时段已有订单，无法删除'], 422);
        }

        $pickupSlot->delete();

        return response()->json(['message' => '取货时段已删除']);
    }

    public function bulkCreate(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'time_slots' => 'required|array',
            'time_slots.*.start_time' => 'required|date_format:H:i:s',
            'time_slots.*.end_time' => 'required|date_format:H:i:s|after:start_time',
            'time_slots.*.max_orders' => 'required|integer|min:1',
            'exclude_weekends' => 'boolean',
        ]);

        $created = 0;
        $startDate = new \DateTime($request->start_date);
        $endDate = new \DateTime($request->end_date);
        $excludeWeekends = $request->exclude_weekends ?? false;

        for ($date = clone $startDate; $date <= $endDate; $date->modify('+1 day')) {
            if ($excludeWeekends && ($date->format('N') >= 6)) {
                continue;
            }

            foreach ($request->time_slots as $timeSlot) {
                $existing = PickupSlot::where('date', $date->format('Y-m-d'))
                    ->where('start_time', $timeSlot['start_time'])
                    ->where('end_time', $timeSlot['end_time'])
                    ->first();

                if (!$existing) {
                    PickupSlot::create([
                        'date' => $date->format('Y-m-d'),
                        'start_time' => $timeSlot['start_time'],
                        'end_time' => $timeSlot['end_time'],
                        'max_orders' => $timeSlot['max_orders'],
                        'current_orders' => 0,
                        'is_active' => true,
                    ]);
                    $created++;
                }
            }
        }

        return response()->json([
            'message' => "成功创建 {$created} 个取货时段",
            'created_count' => $created,
        ]);
    }
}
