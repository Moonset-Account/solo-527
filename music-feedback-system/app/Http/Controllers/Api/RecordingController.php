<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ParentAccessDeniedException;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePracticeRecordingRequest;
use App\Http\Resources\PracticeRecordingResource;
use App\Models\Assignment;
use App\Models\PracticeRecording;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RecordingController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', PracticeRecording::class);

        $query = PracticeRecording::with(['student', 'assignment']);

        if ($request->filled('saved_filter_id')) {
            $savedFilter = $request->user()->savedFilters()
                ->where('module', 'recordings')
                ->findOrFail($request->saved_filter_id);
            $request->merge($savedFilter->filter_config);
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->filled('assignment_id')) {
            $query->where('assignment_id', $request->assignment_id);
        }

        $user = $request->user();
        if ($user->role === 'parent') {
            $childIds = Student::where('parent_user_id', $user->id)->pluck('id');
            $query->whereIn('student_id', $childIds);
        } elseif ($user->role === 'teacher') {
            $studentIds = Student::where('teacher_user_id', $user->id)->pluck('id');
            $query->whereIn('student_id', $studentIds);
        }

        return PracticeRecordingResource::collection(
            $query->paginate(20)
        );
    }

    public function store(StorePracticeRecordingRequest $request): PracticeRecordingResource
    {
        $this->authorize('create', PracticeRecording::class);

        $user = $request->user();
        $studentId = $request->validated('student_id');
        $assignmentId = $request->validated('assignment_id');

        $student = Student::findOrFail($studentId);

        if ($user->role === 'parent') {
            if ($student->parent_user_id !== $user->id) {
                throw new ParentAccessDeniedException();
            }
        } elseif ($user->role === 'teacher') {
            if ($student->teacher_user_id !== $user->id) {
                abort(403, '您只能为分配给您的学生上传录音');
            }
        }

        $assignment = Assignment::findOrFail($assignmentId);
        if ($assignment->student_id !== $studentId) {
            abort(422, '该作业不属于指定学生');
        }

        $file = $request->file('file');
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

        return new PracticeRecordingResource($recording->load(['student', 'assignment']));
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
