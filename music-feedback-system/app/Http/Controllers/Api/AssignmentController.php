<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\InvalidStatusTransitionException;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssignmentRequest;
use App\Http\Requests\UpdateAssignmentRequest;
use App\Http\Resources\AssignmentResource;
use App\Models\ApprovalFlow;
use App\Models\Assignment;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AssignmentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Assignment::class);

        $query = Assignment::with(['teacher', 'student', 'piece'])
            ->withCount('practiceRecordings');

        if ($request->filled('saved_filter_id')) {
            $savedFilter = $request->user()->savedFilters()->findOrFail($request->saved_filter_id);
            $request->merge($savedFilter->filter_config);
        }

        $user = $request->user();
        if ($user->role === 'teacher') {
            $query->where('teacher_user_id', $user->id);
        } elseif ($request->filled('teacher_user_id')) {
            $query->where('teacher_user_id', $request->teacher_user_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($user->role !== 'teacher' && $request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        } elseif ($user->role === 'teacher' && $request->filled('student_id')) {
            $student = Student::find($request->student_id);
            if ($student && $student->teacher_user_id === $user->id) {
                $query->where('student_id', $request->student_id);
            }
        }

        if ($request->filled('instrument')) {
            $query->whereHas('piece', fn($q) => $q->where('instrument', $request->instrument));
        }

        if ($request->filled('due_date_from')) {
            $query->where('due_date', '>=', $request->due_date_from);
        }

        if ($request->filled('due_date_to')) {
            $query->where('due_date', '<=', $request->due_date_to);
        }

        return AssignmentResource::collection(
            $query->paginate(20)
        );
    }

    public function store(StoreAssignmentRequest $request): AssignmentResource
    {
        $this->authorize('create', Assignment::class);

        $user = $request->user();
        $data = $request->validated();

        if ($user->role === 'teacher') {
            if (isset($data['teacher_user_id']) && $data['teacher_user_id'] != $user->id) {
                abort(403, '您只能以自己的身份创建作业');
            }
            $data['teacher_user_id'] = $user->id;

            $student = Student::findOrFail($data['student_id']);
            if ($student->teacher_user_id !== $user->id) {
                abort(403, '您只能为分配给您的学生创建作业');
            }
        }

        $assignment = Assignment::create($data);

        return new AssignmentResource($assignment->load(['teacher', 'student', 'piece']));
    }

    public function show(int $id): AssignmentResource
    {
        $assignment = Assignment::with(['teacher', 'student', 'piece', 'parentConfirmations', 'latestApproval'])
            ->withCount('practiceRecordings')
            ->findOrFail($id);

        $this->authorize('view', $assignment);

        return new AssignmentResource($assignment);
    }

    public function update(UpdateAssignmentRequest $request, int $id): AssignmentResource
    {
        $assignment = Assignment::findOrFail($id);

        $this->authorize('update', $assignment);

        $user = $request->user();
        $data = $request->validated();

        if ($user->role === 'teacher') {
            $data['teacher_user_id'] = $assignment->teacher_user_id;

            if (isset($data['student_id'])) {
                $student = Student::findOrFail($data['student_id']);
                if ($student->teacher_user_id !== $user->id) {
                    abort(403, '您只能将作业分配给您的学生');
                }
            }
        }

        $assignment->update($data);

        return new AssignmentResource($assignment->load(['teacher', 'student', 'piece']));
    }

    public function destroy(int $id): JsonResponse
    {
        $assignment = Assignment::findOrFail($id);

        $this->authorize('delete', $assignment);

        if ($assignment->status !== 'draft') {
            throw new InvalidStatusTransitionException($assignment->status, 'deleted');
        }

        $assignment->delete();

        return response()->json(null, 204);
    }

    public function publish(Request $request, int $id): AssignmentResource
    {
        $assignment = Assignment::findOrFail($id);

        $this->authorize('publish', $assignment);

        if ($assignment->status !== 'draft') {
            throw new InvalidStatusTransitionException($assignment->status, 'published');
        }

        $assignment->update(['status' => 'published']);

        ApprovalFlow::create([
            'approvable_type' => Assignment::class,
            'approvable_id' => $assignment->id,
            'approver_user_id' => $request->user()->id,
            'action' => 'submit',
        ]);

        return new AssignmentResource($assignment->load(['teacher', 'student', 'piece', 'latestApproval']));
    }

    public function withdraw(Request $request, int $id): AssignmentResource
    {
        $assignment = Assignment::findOrFail($id);

        $this->authorize('withdraw', $assignment);

        if (!in_array($assignment->status, ['published', 'submitted'])) {
            throw new InvalidStatusTransitionException($assignment->status, 'withdrawn');
        }

        $assignment->update(['status' => 'draft']);

        ApprovalFlow::create([
            'approvable_type' => Assignment::class,
            'approvable_id' => $assignment->id,
            'approver_user_id' => $request->user()->id,
            'action' => 'withdraw',
        ]);

        return new AssignmentResource($assignment->load(['teacher', 'student', 'piece', 'latestApproval']));
    }
}
