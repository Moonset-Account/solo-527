<?php

namespace App\Http\Controllers;

use App\Models\TeacherHour;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TeacherHourController extends Controller
{
    public function index(Request $request)
    {
        $hours = TeacherHour::with(['teacher', 'artClass'])
            ->when($request->teacher_id, fn($q, $v) => $q->where('teacher_id', $v))
            ->when($request->art_class_id, fn($q, $v) => $q->where('art_class_id', $v))
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->type, fn($q, $v) => $q->where('type', $v))
            ->when($request->month, function ($q, $v) {
                $q->whereYear('date', substr($v, 0, 4))
                    ->whereMonth('date', substr($v, 5, 2));
            })
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('TeacherHours/Index', [
            'hours' => $hours,
            'filters' => $request->only(['teacher_id', 'art_class_id', 'status', 'type', 'month']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'teacher_id' => 'required|exists:users,id',
            'art_class_id' => 'required|exists:art_classes,id',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'hours' => 'required|numeric|min:0.01',
            'type' => 'required|string|max:100',
            'status' => 'required|string|max:50',
            'notes' => 'nullable|string',
        ]);

        TeacherHour::create($validated);

        return redirect()->back()->with('success', '课时记录创建成功');
    }

    public function confirm($id)
    {
        $hour = TeacherHour::findOrFail($id);
        $hour->update(['status' => 'confirmed']);

        return redirect()->back()->with('success', '课时已确认');
    }

    public function dispute($id)
    {
        $hour = TeacherHour::findOrFail($id);
        $hour->update(['status' => 'disputed']);

        return redirect()->back()->with('success', '课时已标记争议');
    }

    public function summary(Request $request)
    {
        $month = $request->input('month', now()->format('Y-m'));

        $summary = TeacherHour::with(['teacher', 'artClass'])
            ->whereYear('date', substr($month, 0, 4))
            ->whereMonth('date', substr($month, 5, 2))
            ->where('status', 'confirmed')
            ->get()
            ->groupBy('teacher_id')
            ->map(function ($items, $teacherId) {
                $teacher = $items->first()->teacher;
                return [
                    'teacher_id' => $teacherId,
                    'teacher_name' => $teacher->name ?? '',
                    'total_hours' => $items->sum('hours'),
                    'total_amount' => $items->sum(fn($item) => $item->hours * ($item->teacher->teacherProfile->hourly_rate ?? 0)),
                    'details' => $items->map(fn($item) => [
                        'art_class' => $item->artClass->name ?? '',
                        'date' => $item->date->format('Y-m-d'),
                        'hours' => $item->hours,
                        'type' => $item->type,
                    ]),
                ];
            })
            ->values();

        return response()->json($summary);
    }
}
