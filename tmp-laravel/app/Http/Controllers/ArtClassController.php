<?php

namespace App\Http\Controllers;

use App\Models\ArtClass;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ArtClassController extends Controller
{
    public function index(Request $request)
    {
        $artClasses = ArtClass::with('teacher')
            ->withCount('students')
            ->when($request->search, fn($q, $v) => $q->where('name', 'like', "%{$v}%"))
            ->when($request->type, fn($q, $v) => $q->where('type', $v))
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->teacher_id, fn($q, $v) => $q->where('teacher_id', $v))
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('ArtClasses/Index', [
            'artClasses' => $artClasses,
            'filters' => $request->only(['search', 'type', 'status', 'teacher_id']),
        ]);
    }

    public function show($id)
    {
        $artClass = ArtClass::with(['students', 'artworks', 'stageReports'])
            ->findOrFail($id);

        return Inertia::render('ArtClasses/Show', [
            'artClass' => $artClass,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:100',
            'level' => 'nullable|string|max:100',
            'teacher_id' => 'required|exists:users,id',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'schedule' => 'nullable|array',
            'max_students' => 'nullable|integer|min:1',
            'status' => 'required|string|max:50',
            'description' => 'nullable|string',
        ]);

        ArtClass::create($validated);

        return redirect()->back()->with('success', '班级创建成功');
    }

    public function update(Request $request, $id)
    {
        $artClass = ArtClass::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:100',
            'level' => 'nullable|string|max:100',
            'teacher_id' => 'required|exists:users,id',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'schedule' => 'nullable|array',
            'max_students' => 'nullable|integer|min:1',
            'status' => 'required|string|max:50',
            'description' => 'nullable|string',
        ]);

        $artClass->update($validated);

        return redirect()->back()->with('success', '班级更新成功');
    }

    public function destroy($id)
    {
        ArtClass::findOrFail($id)->delete();

        return redirect()->back()->with('success', '班级删除成功');
    }
}
