<?php

namespace App\Http\Controllers;

use App\Models\Greenhouse;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GreenhouseController extends Controller
{
    public function index(Request $request)
    {
        $query = Greenhouse::with('manager');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($managerId = $request->input('manager_id')) {
            $query->where('manager_id', $managerId);
        }

        $query->orderBy($request->input('sort_by', 'created_at'), $request->input('sort_direction', 'desc'));

        $greenhouses = $query->paginate($request->input('per_page', 15))->withQueryString();

        $managers = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Greenhouses/Index', [
            'greenhouses' => $greenhouses,
            'managers' => $managers,
            'filters' => $request->only(['search', 'status', 'manager_id']),
        ]);
    }

    public function create()
    {
        $managers = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Greenhouses/Create', [
            'managers' => $managers,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:greenhouses,code|max:50',
            'location' => 'required|string|max:500',
            'area' => 'nullable|numeric',
            'crop_type' => 'nullable|string|max:100',
            'status' => 'required|string|in:active,inactive,maintenance',
            'manager_id' => 'nullable|exists:users,id',
        ]);

        $greenhouse = Greenhouse::create($validated);

        return redirect()->route('greenhouses.show', $greenhouse)->with('success', '大棚创建成功');
    }

    public function show(Greenhouse $greenhouse)
    {
        $greenhouse->load([
            'manager',
            'environmentSensors',
            'environmentAlerts' => function ($query) {
                $query->orderBy('created_at', 'desc')->limit(10);
            },
        ]);

        return Inertia::render('Greenhouses/Show', [
            'greenhouse' => $greenhouse,
        ]);
    }

    public function edit(Greenhouse $greenhouse)
    {
        $managers = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Greenhouses/Edit', [
            'greenhouse' => $greenhouse,
            'managers' => $managers,
        ]);
    }

    public function update(Request $request, Greenhouse $greenhouse)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:greenhouses,code,' . $greenhouse->id . '|max:50',
            'location' => 'required|string|max:500',
            'area' => 'nullable|numeric',
            'crop_type' => 'nullable|string|max:100',
            'status' => 'required|string|in:active,inactive,maintenance',
            'manager_id' => 'nullable|exists:users,id',
        ]);

        $greenhouse->update($validated);

        return redirect()->route('greenhouses.show', $greenhouse)->with('success', '大棚更新成功');
    }

    public function destroy(Greenhouse $greenhouse)
    {
        $greenhouse->delete();

        return redirect()->route('greenhouses.index')->with('success', '大棚已删除');
    }
}
