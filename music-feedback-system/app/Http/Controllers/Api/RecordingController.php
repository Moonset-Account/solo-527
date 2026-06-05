<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePracticeRecordingRequest;
use App\Http\Resources\PracticeRecordingResource;
use App\Models\PracticeRecording;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RecordingController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', PracticeRecording::class);

        $query = PracticeRecording::with(['student']);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->filled('assignment_id')) {
            $query->where('assignment_id', $request->assignment_id);
        }

        return PracticeRecordingResource::collection(
            $query->paginate(20)
        );
    }

    public function store(StorePracticeRecordingRequest $request): PracticeRecordingResource
    {
        $this->authorize('create', PracticeRecording::class);

        $file = $request->file('file');
        $studentId = $request->validated('student_id');
        $path = $file->store("recordings/{$studentId}", 'local');

        $recording = PracticeRecording::create(
            array_merge(
                $request->safe()->except('file'),
                [
                    'file_path' => $path,
                    'duration_seconds' => $request->validated('duration_seconds') ?? 0,
                ]
            )
        );

        return new PracticeRecordingResource($recording->load(['student']));
    }

    public function show(int $id): PracticeRecordingResource
    {
        $recording = PracticeRecording::with(['student', 'annotations'])->findOrFail($id);

        $this->authorize('view', $recording);

        return new PracticeRecordingResource($recording);
    }

    public function destroy(int $id): JsonResponse
    {
        $recording = PracticeRecording::findOrFail($id);

        $this->authorize('delete', $recording);

        $recording->delete();

        return response()->json(null, 204);
    }
}
