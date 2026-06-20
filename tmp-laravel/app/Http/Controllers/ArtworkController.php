<?php

namespace App\Http\Controllers;

use App\Models\Artwork;
use App\Models\ArtworkFeedback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ArtworkController extends Controller
{
    public function index(Request $request)
    {
        $artworks = Artwork::with(['student', 'artClass', 'teacher', 'feedback'])
            ->when($request->search, fn($q, $v) => $q->where('title', 'like', "%{$v}%"))
            ->when($request->student_id, fn($q, $v) => $q->where('student_id', $v))
            ->when($request->art_class_id, fn($q, $v) => $q->where('art_class_id', $v))
            ->when($request->teacher_id, fn($q, $v) => $q->where('teacher_id', $v))
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Artworks/Index', [
            'artworks' => $artworks,
            'filters' => $request->only(['search', 'student_id', 'art_class_id', 'teacher_id', 'status']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'art_class_id' => 'required|exists:art_classes,id',
            'teacher_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'required|image|max:10240',
            'status' => 'required|string|max:50',
        ]);

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('artworks', 'public');
        }

        unset($validated['image']);
        $validated['submitted_at'] = now();

        Artwork::create($validated);

        return redirect()->back()->with('success', '作品提交成功');
    }

    public function show($id)
    {
        $artwork = Artwork::with(['feedback.teacher', 'student', 'artClass'])
            ->findOrFail($id);

        return Inertia::render('Artworks/Show', [
            'artwork' => $artwork,
        ]);
    }

    public function updateFeedback(Request $request, $id)
    {
        $artwork = Artwork::findOrFail($id);

        $validated = $request->validate([
            'content' => 'required|string',
            'score' => 'required|numeric|min:0|max:100',
        ]);

        ArtworkFeedback::create([
            'artwork_id' => $artwork->id,
            'teacher_id' => $request->user()->id,
            'content' => $validated['content'],
            'score' => $validated['score'],
        ]);

        return redirect()->back()->with('success', '点评提交成功');
    }
}
