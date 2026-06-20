<?php

namespace App\Http\Controllers;

use App\Models\EnrollmentConversion;
use App\Models\Student;
use App\Models\TrialBooking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TrialBookingController extends Controller
{
    public function index(Request $request)
    {
        $bookings = TrialBooking::with('artClass')
            ->when($request->search, function ($q, $v) {
                $q->where('student_name', 'like', "%{$v}%")
                    ->orWhere('phone', 'like', "%{$v}%");
            })
            ->when($request->art_class_id, fn($q, $v) => $q->where('art_class_id', $v))
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->source, fn($q, $v) => $q->where('source', $v))
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('TrialBookings/Index', [
            'bookings' => $bookings,
            'filters' => $request->only(['search', 'art_class_id', 'status', 'source']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'art_class_id' => 'required|exists:art_classes,id',
            'preferred_date' => 'required|date',
            'preferred_time' => 'required|string|max:20',
            'source' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        $validated['status'] = 'pending';

        TrialBooking::create($validated);

        return redirect()->back()->with('success', '试课预约创建成功');
    }

    public function confirm($id)
    {
        $booking = TrialBooking::findOrFail($id);
        $booking->update(['status' => 'confirmed']);

        return redirect()->back()->with('success', '预约已确认');
    }

    public function complete($id)
    {
        $booking = TrialBooking::findOrFail($id);
        $booking->update(['status' => 'completed']);

        return redirect()->back()->with('success', '试课已完成');
    }

    public function cancel($id)
    {
        $booking = TrialBooking::findOrFail($id);
        $booking->update(['status' => 'cancelled']);

        return redirect()->back()->with('success', '预约已取消');
    }

    public function convert(Request $request, $id)
    {
        $booking = TrialBooking::findOrFail($id);

        $validated = $request->validate([
            'conversion_type' => 'required|string|max:100',
        ]);

        DB::transaction(function () use ($booking, $validated, $request) {
            $student = Student::create([
                'name' => $booking->student_name,
                'phone' => $booking->phone,
                'art_class_id' => $booking->art_class_id,
                'enrollment_date' => now()->toDateString(),
                'status' => 'active',
            ]);

            EnrollmentConversion::create([
                'trial_booking_id' => $booking->id,
                'student_id' => $student->id,
                'art_class_id' => $booking->art_class_id,
                'converted_at' => now(),
                'conversion_type' => $validated['conversion_type'],
                'operator_id' => $request->user()->id,
            ]);

            $booking->update([
                'converted' => true,
                'converted_at' => now(),
            ]);
        });

        return redirect()->back()->with('success', '学员转化成功');
    }
}
