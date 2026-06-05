<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAnnotationRequest;
use App\Http\Resources\AnnotationResource;
use App\Models\Annotation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AnnotationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Annotation::class);

        $request->validate(['practice_recording_id' => 'required|exists:practice_recordings,id']);

        $recording = \App\Models\PracticeRecording::findOrFail($request->practice_recording_id);

        if ($request->user()->role === 'parent') {
            if ($recording->student->parent_user_id !== $request->user()->id) {
                abort(403, '您只能查看自己孩子的记录');
            }
        }

        $annotations = Annotation::where('practice_recording_id', $request->practice_recording_id)
            ->with(['teacher'])
            ->get();

        return AnnotationResource::collection($annotations);
    }

    public function store(StoreAnnotationRequest $request): AnnotationResource
    {
        $this->authorize('create', Annotation::class);

        $annotation = Annotation::create(
            array_merge($request->validated(), ['teacher_user_id' => $request->user()->id])
        );

        return new AnnotationResource($annotation->load(['teacher']));
    }

    public function show(int $id): AnnotationResource
    {
        $annotation = Annotation::with(['teacher'])->findOrFail($id);

        $this->authorize('view', $annotation);

        return new AnnotationResource($annotation);
    }

    public function update(Request $request, int $id): AnnotationResource
    {
        $annotation = Annotation::findOrFail($id);

        $this->authorize('update', $annotation);

        $validated = $request->validate([
            'content' => 'sometimes|string',
            'timestamp_ms' => 'sometimes|integer|min:0',
        ]);

        $annotation->update($validated);

        return new AnnotationResource($annotation->load(['teacher']));
    }

    public function destroy(int $id): JsonResponse
    {
        $annotation = Annotation::findOrFail($id);

        $this->authorize('delete', $annotation);

        $annotation->delete();

        return response()->json(null, 204);
    }
}
