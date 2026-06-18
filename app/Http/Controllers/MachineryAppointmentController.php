<?php

namespace App\Http\Controllers;

use App\Models\Greenhouse;
use App\Models\MachineryAppointment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MachineryAppointmentController extends Controller
{
    public function index(Request $request)
    {
        $query = MachineryAppointment::with(['greenhouse', 'applicant', 'operator']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('appointment_no', 'like', "%{$search}%")
                    ->orWhere('machinery_name', 'like', "%{$search}%")
                    ->orWhere('machinery_type', 'like', "%{$search}%")
                    ->orWhereHas('applicant', function ($subQ) use ($search) {
                        $subQ->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($greenhouseId = $request->input('greenhouse_id')) {
            $query->where('greenhouse_id', $greenhouseId);
        }

        if ($machineryType = $request->input('machinery_type')) {
            $query->where('machinery_type', $machineryType);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($operatorId = $request->input('operator_id')) {
            $query->where('operator_id', $operatorId);
        }

        if ($startDate = $request->input('start_date')) {
            $query->whereDate('start_time', '>=', $startDate);
        }

        if ($endDate = $request->input('end_date')) {
            $query->whereDate('end_time', '<=', $endDate);
        }

        $query->orderBy($request->input('sort_by', 'created_at'), $request->input('sort_direction', 'desc'));

        $appointments = $query->paginate($request->input('per_page', 15))->withQueryString();

        $greenhouses = Greenhouse::orderBy('name')->get(['id', 'name']);
        $operators = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('MachineryAppointments/Index', [
            'appointments' => $appointments,
            'greenhouses' => $greenhouses,
            'operators' => $operators,
            'filters' => $request->only([
                'search', 'greenhouse_id', 'machinery_type', 'status',
                'operator_id', 'start_date', 'end_date',
            ]),
        ]);
    }

    public function create()
    {
        $greenhouses = Greenhouse::orderBy('name')->get(['id', 'name']);
        $operators = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('MachineryAppointments/Create', [
            'greenhouses' => $greenhouses,
            'operators' => $operators,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'appointment_no' => 'required|string|unique:machinery_appointments,appointment_no|max:50',
            'greenhouse_id' => 'required|exists:greenhouses,id',
            'machinery_type' => 'required|string|in:tractor,harvester,sprayer,irrigator,other',
            'machinery_name' => 'required|string|max:100',
            'purpose' => 'required|string|max:500',
            'start_time' => 'required|date|after:now',
            'end_time' => 'required|date|after:start_time',
            'status' => 'required|string|in:pending,approved,rejected,completed,cancelled',
            'operator_id' => 'nullable|exists:users,id',
            'remark' => 'nullable|string|max:1000',
        ]);

        $validated['applicant_id'] = Auth::id();

        $appointment = MachineryAppointment::create($validated);

        return redirect()->route('machinery-appointments.show', $appointment)->with('success', '农机预约创建成功');
    }

    public function show(MachineryAppointment $machineryAppointment)
    {
        $machineryAppointment->load(['greenhouse', 'applicant', 'operator']);

        return Inertia::render('MachineryAppointments/Show', [
            'appointment' => $machineryAppointment,
        ]);
    }

    public function update(Request $request, MachineryAppointment $machineryAppointment)
    {
        $validated = $request->validate([
            'appointment_no' => 'required|string|unique:machinery_appointments,appointment_no,' . $machineryAppointment->id . '|max:50',
            'greenhouse_id' => 'required|exists:greenhouses,id',
            'machinery_type' => 'required|string|in:tractor,harvester,sprayer,irrigator,other',
            'machinery_name' => 'required|string|max:100',
            'purpose' => 'required|string|max:500',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'status' => 'required|string|in:pending,approved,rejected,completed,cancelled',
            'operator_id' => 'nullable|exists:users,id',
            'remark' => 'nullable|string|max:1000',
        ]);

        $machineryAppointment->update($validated);

        return redirect()->route('machinery-appointments.show', $machineryAppointment)->with('success', '农机预约更新成功');
    }

    public function approve(Request $request, MachineryAppointment $machineryAppointment)
    {
        $validated = $request->validate([
            'operator_id' => 'required|exists:users,id',
            'remark' => 'nullable|string|max:1000',
        ]);

        $machineryAppointment->update([
            ...$validated,
            'status' => 'approved',
        ]);

        return redirect()->back()->with('success', '农机预约已批准');
    }

    public function reject(Request $request, MachineryAppointment $machineryAppointment)
    {
        $request->validate([
            'remark' => 'required|string|max:1000',
        ]);

        $machineryAppointment->update([
            'status' => 'rejected',
        ]);

        return redirect()->back()->with('success', '农机预约已拒绝');
    }

    public function complete(MachineryAppointment $machineryAppointment)
    {
        $machineryAppointment->update([
            'status' => 'completed',
        ]);

        return redirect()->back()->with('success', '农机作业已完成');
    }
}
