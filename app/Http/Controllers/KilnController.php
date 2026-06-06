<?php

namespace App\Http\Controllers;

use App\Models\Kiln;
use App\Services\KilnSchedulingService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class KilnController extends Controller
{
    protected KilnSchedulingService $schedulingService;

    public function __construct(KilnSchedulingService $schedulingService)
    {
        $this->schedulingService = $schedulingService;
    }

    public function index()
    {
        $kilns = Kiln::with('maintenanceDays')->get();

        return response()->json($kilns);
    }

    public function show(Kiln $kiln)
    {
        $kiln->load(['maintenanceDays', 'kilnBatches' => function ($query) {
            $query->whereNotIn('status', ['cancelled'])->latest('scheduled_fire_date')->take(10);
        }]);

        return response()->json($kiln);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:kilns',
            'description' => 'nullable|string',
            'capacity' => 'required|integer|min:1',
            'width' => 'required|numeric|min:0',
            'height' => 'required|numeric|min:0',
            'depth' => 'required|numeric|min:0',
            'temp_max' => 'required|integer|min:0',
            'temperature_zones' => 'required|array',
            'type' => 'in:electric,gas,wood',
        ]);

        $kiln = Kiln::create($request->all());

        return response()->json($kiln, 201);
    }

    public function update(Request $request, Kiln $kiln)
    {
        $request->validate([
            'name' => 'string|max:255',
            'code' => 'string|unique:kilns,code,' . $kiln->id,
            'description' => 'nullable|string',
            'capacity' => 'integer|min:1',
            'width' => 'numeric|min:0',
            'height' => 'numeric|min:0',
            'depth' => 'numeric|min:0',
            'temp_max' => 'integer|min:0',
            'temperature_zones' => 'array',
            'type' => 'in:electric,gas,wood',
            'is_active' => 'boolean',
        ]);

        $kiln->update($request->all());

        return response()->json($kiln->fresh());
    }

    public function getAvailableSlots(Request $request, Kiln $kiln)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'days' => 'nullable|integer|min:1|max:90',
        ]);

        $startDate = $request->has('start_date')
            ? Carbon::parse($request->start_date)
            : Carbon::now();

        $days = $request->days ?? 30;

        $slots = $this->schedulingService->getAvailableSlots($kiln, $startDate, $days);

        return response()->json($slots);
    }

    public function addMaintenanceDay(Request $request, Kiln $kiln)
    {
        $request->validate([
            'maintenance_date' => 'required|date',
            'reason' => 'nullable|string',
            'is_recurring_weekly' => 'boolean',
            'day_of_week' => 'required_if:is_recurring_weekly,true|integer|min:0|max:6',
        ]);

        $maintenanceDay = $kiln->maintenanceDays()->create($request->all());

        return response()->json($maintenanceDay, 201);
    }

    public function removeMaintenanceDay(Kiln $kiln, $maintenanceId)
    {
        $maintenanceDay = $kiln->maintenanceDays()->findOrFail($maintenanceId);
        $maintenanceDay->delete();

        return response()->json(['message' => '维护日已删除']);
    }
}
