<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWorkStationRequest;
use App\Http\Requests\UpdateWorkStationRequest;
use App\Models\WorkStation;
use Inertia\Inertia;

class WorkStationController extends Controller
{
    public function index()
    {
        $stations = WorkStation::orderBy('name')->paginate(20);

        return Inertia::render('WorkStations/Index', [
            'stations' => $stations,
        ]);
    }

    public function store(StoreWorkStationRequest $request)
    {
        WorkStation::create($request->validated());

        return redirect()->route('work-stations.index')->with('success', 'Work station created.');
    }

    public function update(UpdateWorkStationRequest $request, WorkStation $workStation)
    {
        $workStation->update($request->validated());

        return redirect()->route('work-stations.index')->with('success', 'Work station updated.');
    }

    public function destroy(WorkStation $workStation)
    {
        $workStation->delete();

        return redirect()->route('work-stations.index')->with('success', 'Work station deleted.');
    }
}
