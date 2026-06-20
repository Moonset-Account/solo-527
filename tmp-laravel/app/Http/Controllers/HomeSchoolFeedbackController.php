<?php

namespace App\Http\Controllers;

use App\Exports\HomeSchoolFeedbackExport;
use App\Models\HomeSchoolFeedback;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class HomeSchoolFeedbackController extends Controller
{
    public function index(Request $request)
    {
        $feedbacks = HomeSchoolFeedback::with(['student', 'teacher'])
            ->when($request->search, function ($q, $v) {
                $q->where('content', 'like', "%{$v}%")
                    ->orWhereHas('student', fn($q2) => $q2->where('name', 'like', "%{$v}%"));
            })
            ->when($request->student_id, fn($q, $v) => $q->where('student_id', $v))
            ->when($request->teacher_id, fn($q, $v) => $q->where('teacher_id', $v))
            ->when($request->type, fn($q, $v) => $q->where('type', $v))
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('HomeSchoolFeedback/Index', [
            'feedbacks' => $feedbacks,
            'filters' => $request->only(['search', 'student_id', 'teacher_id', 'type']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'teacher_id' => 'required|exists:users,id',
            'type' => 'required|string|max:100',
            'content' => 'required|string',
        ]);

        HomeSchoolFeedback::create($validated);

        return redirect()->back()->with('success', '家校反馈创建成功');
    }

    public function remind($id)
    {
        $feedback = HomeSchoolFeedback::findOrFail($id);
        $feedback->update(['reminded_at' => now()]);

        return redirect()->back()->with('success', '已发送提醒');
    }

    public function reply(Request $request, $id)
    {
        $feedback = HomeSchoolFeedback::findOrFail($id);

        $validated = $request->validate([
            'parent_reply' => 'required|string',
        ]);

        $feedback->update([
            'parent_reply' => $validated['parent_reply'],
            'parent_read_at' => now(),
        ]);

        return redirect()->back()->with('success', '回复提交成功');
    }

    public function export(Request $request)
    {
        $feedbacks = HomeSchoolFeedback::with(['student', 'teacher'])
            ->when($request->student_id, fn($q, $v) => $q->where('student_id', $v))
            ->when($request->teacher_id, fn($q, $v) => $q->where('teacher_id', $v))
            ->when($request->type, fn($q, $v) => $q->where('type', $v))
            ->when($request->start_date, fn($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($request->end_date, fn($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->get();

        return Excel::download(new HomeSchoolFeedbackExport($feedbacks), 'home-school-feedback.xlsx');
    }
}
