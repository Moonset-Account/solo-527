<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $students = Student::with('artClass')
            ->when($request->search, function ($q, $v) {
                $q->where('name', 'like', "%{$v}%")
                    ->orWhere('phone', 'like', "%{$v}%");
            })
            ->when($request->art_class_id, fn($q, $v) => $q->where('art_class_id', $v))
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Students/Index', [
            'students' => $students,
            'filters' => $request->only(['search', 'art_class_id', 'status']),
        ]);
    }

    public function show($id)
    {
        $student = Student::with([
            'artClass',
            'artworks.feedback',
            'homeSchoolFeedback.teacher',
        ])->findOrFail($id);

        return Inertia::render('Students/Show', [
            'student' => $student,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'gender' => 'nullable|string|max:10',
            'birth_date' => 'nullable|date',
            'phone' => 'nullable|string|max:20',
            'guardian_name' => 'nullable|string|max:255',
            'guardian_phone' => 'nullable|string|max:20',
            'art_class_id' => 'required|exists:art_classes,id',
            'enrollment_date' => 'required|date',
            'status' => 'required|string|max:50',
            'notes' => 'nullable|string',
        ]);

        Student::create($validated);

        return redirect()->back()->with('success', '学员创建成功');
    }

    public function update(Request $request, $id)
    {
        $student = Student::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'gender' => 'nullable|string|max:10',
            'birth_date' => 'nullable|date',
            'phone' => 'nullable|string|max:20',
            'guardian_name' => 'nullable|string|max:255',
            'guardian_phone' => 'nullable|string|max:20',
            'art_class_id' => 'required|exists:art_classes,id',
            'enrollment_date' => 'required|date',
            'status' => 'required|string|max:50',
            'notes' => 'nullable|string',
        ]);

        $student->update($validated);

        return redirect()->back()->with('success', '学员更新成功');
    }

    public function destroy($id)
    {
        Student::findOrFail($id)->delete();

        return redirect()->back()->with('success', '学员删除成功');
    }
}
