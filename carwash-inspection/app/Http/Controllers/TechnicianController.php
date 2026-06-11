<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTechnicianRequest;
use App\Http\Requests\UpdateTechnicianRequest;
use App\Models\Technician;
use Inertia\Inertia;

class TechnicianController extends Controller
{
    public function index()
    {
        $technicians = Technician::with('user')->orderBy('name')->paginate(20);

        return Inertia::render('Technicians/Index', [
            'technicians' => $technicians,
        ]);
    }

    public function store(StoreTechnicianRequest $request)
    {
        Technician::create($request->validated());

        return redirect()->route('technicians.index')->with('success', 'Technician created.');
    }

    public function update(UpdateTechnicianRequest $request, Technician $technician)
    {
        $technician->update($request->validated());

        return redirect()->route('technicians.index')->with('success', 'Technician updated.');
    }

    public function destroy(Technician $technician)
    {
        $technician->delete();

        return redirect()->route('technicians.index')->with('success', 'Technician deleted.');
    }
}
