<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreParentConfirmationRequest;
use App\Http\Resources\ParentConfirmationResource;
use App\Models\ParentConfirmation;
use App\Exceptions\ParentAccessDeniedException;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ParentConfirmationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', ParentConfirmation::class);

        $query = ParentConfirmation::with(['parent', 'assignment', 'student']);

        $user = $request->user();

        if ($user->role === 'parent') {
            $query->where('parent_user_id', $user->id);
        } elseif ($user->role === 'teacher') {
            $query->whereHas('student', fn($q) => $q->where('teacher_user_id', $user->id));
        }

        if ($request->filled('assignment_id')) {
            $query->where('assignment_id', $request->assignment_id);
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->filled('confirmed')) {
            $query->where('confirmed', filter_var($request->confirmed, FILTER_VALIDATE_BOOLEAN));
        }

        return ParentConfirmationResource::collection($query->paginate(20));
    }

    public function store(StoreParentConfirmationRequest $request): ParentConfirmationResource
    {
        $this->authorize('create', ParentConfirmation::class);

        $user = $request->user();

        if ($user->role === 'parent') {
            $student = \App\Models\Student::findOrFail($request->student_id);
            if ($student->parent_user_id !== $user->id) {
                throw new ParentAccessDeniedException();
            }

            $assignment = \App\Models\Assignment::findOrFail($request->assignment_id);
            if ($assignment->student_id !== $request->student_id) {
                abort(422, '该作业不属于指定学生');
            }
        }

        $exists = ParentConfirmation::where('parent_user_id', $user->role === 'parent' ? $user->id : $request->input('parent_user_id', $user->id))
            ->where('assignment_id', $request->assignment_id)
            ->where('student_id', $request->student_id)
            ->exists();

        if ($exists) {
            abort(422, '该作业已确认，请勿重复提交');
        }

        $confirmation = ParentConfirmation::create(
            array_merge($request->validated(), [
                'parent_user_id' => $user->role === 'parent' ? $user->id : $request->input('parent_user_id'),
            ])
        );

        return new ParentConfirmationResource($confirmation->load(['parent', 'assignment', 'student']));
    }

    public function show(int $id): ParentConfirmationResource
    {
        $confirmation = ParentConfirmation::with(['parent', 'assignment', 'student'])->findOrFail($id);

        $this->authorize('view', $confirmation);

        return new ParentConfirmationResource($confirmation);
    }
}
