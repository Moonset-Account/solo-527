<?php

namespace App\Http\Controllers;

use App\Models\ScheduleConflict;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScheduleConflictController extends Controller
{
    public function index(Request $request)
    {
        $conflicts = ScheduleConflict::with(['teacher', 'artClass'])
            ->when($request->teacher_id, fn($q, $v) => $q->where('teacher_id', $v))
            ->when($request->art_class_id, fn($q, $v) => $q->where('art_class_id', $v))
            ->when($request->conflict_type, fn($q, $v) => $q->where('conflict_type', $v))
            ->when($request->resolution_status, fn($q, $v) => $q->where('resolution_status', $v))
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('ScheduleConflicts/Index', [
            'conflicts' => $conflicts,
            'filters' => $request->only(['teacher_id', 'art_class_id', 'conflict_type', 'resolution_status']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'teacher_id' => 'required|exists:users,id',
            'art_class_id' => 'required|exists:art_classes,id',
            'conflict_date' => 'required|date',
            'conflict_type' => 'required|string|max:100',
            'description' => 'required|string',
        ]);

        $validated['resolution_status'] = 'pending';

        ScheduleConflict::create($validated);

        return redirect()->back()->with('success', '排课冲突记录创建成功');
    }

    public function resolve(Request $request, $id)
    {
        $conflict = ScheduleConflict::findOrFail($id);

        $validated = $request->validate([
            'resolution' => 'required|string',
        ]);

        $conflict->update([
            'resolution' => $validated['resolution'],
            'resolution_status' => 'resolved',
        ]);

        return redirect()->back()->with('success', '冲突已解决');
    }

    public function ignore($id)
    {
        $conflict = ScheduleConflict::findOrFail($id);
        $conflict->update(['resolution_status' => 'ignored']);

        return redirect()->back()->with('success', '冲突已忽略');
    }

    public function notify($id)
    {
        $conflict = ScheduleConflict::findOrFail($id);
        $conflict->update(['notified_at' => now()]);

        return redirect()->back()->with('success', '已通知相关教师');
    }
}
