<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use App\Models\AuditTrail;

class LocationController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('location.view');

        $query = Location::with('inventories.product')
            ->when($request->keyword, function ($q) use ($request) {
                $q->where('code', 'like', "%{$request->keyword}%")
                    ->orWhere('name', 'like', "%{$request->keyword}%");
            })
            ->when($request->type, fn($q) => $q->where('type', $request->type))
            ->when($request->zone, fn($q) => $q->where('zone', $request->zone))
            ->when($request->is_active, fn($q) => $q->where('is_active', $request->is_active))
            ->orderBy('zone')
            ->orderBy('code');

        return response()->json([
            'data' => $query->paginate($request->per_page ?? 50),
        ]);
    }

    public function show(Location $location)
    {
        Gate::authorize('location.view');

        return response()->json([
            'data' => $location->load('inventories.product'),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('location.create');

        $validated = $request->validate([
            'code' => 'required|string|unique:locations,code',
            'name' => 'nullable|string',
            'type' => 'nullable|in:rack,bin,area,cold,special',
            'zone' => 'nullable|string',
            'capacity' => 'nullable|numeric|min:0',
            'used_capacity' => 'nullable|numeric|min:0',
            'remarks' => 'nullable|string',
        ]);

        $location = Location::create($validated);

        AuditTrail::log(AuditTrail::ACTION_CREATE, 'locations', $location->id, null, $location->toArray());

        return response()->json([
            'message' => '仓位创建成功',
            'data' => $location,
        ], 201);
    }

    public function update(Request $request, Location $location)
    {
        Gate::authorize('location.edit');

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'type' => 'nullable|in:rack,bin,area,cold,special',
            'zone' => 'nullable|string',
            'capacity' => 'nullable|numeric|min:0',
            'remarks' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $oldValues = $location->toArray();
        $location->update($validated);

        AuditTrail::log(AuditTrail::ACTION_UPDATE, 'locations', $location->id, $oldValues, $location->toArray());

        return response()->json([
            'message' => '仓位更新成功',
            'data' => $location,
        ]);
    }
}
