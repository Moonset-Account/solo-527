<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StudentResource;
use App\Models\Assignment;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProgressBoardController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $query = Student::with(['parent', 'teacher'])
            ->withCount(['assignments', 'practiceRecordings']);

        if ($request->filled('saved_filter_id')) {
            $savedFilter = $user->savedFilters()
                ->where('module', 'progress')
                ->findOrFail($request->saved_filter_id);
            $request->merge($savedFilter->filter_config);
        }

        if ($user->role === 'teacher') {
            $query->where('teacher_user_id', $user->id);
        } elseif ($user->role === 'parent') {
            $query->where('parent_user_id', $user->id);
        }

        if ($request->filled('instrument')) {
            $query->where('instrument', $request->instrument);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $students = $query->paginate(20);

        $students->through(function ($student) {
            $totalAssignments = $student->assignments_count;
            $completedAssignments = Assignment::where('student_id', $student->id)
                ->where('status', 'completed')
                ->count();
            $recordingCount = $student->practice_recordings_count;

            $student->completion_rate = $totalAssignments > 0
                ? round(($completedAssignments / $totalAssignments) * 100, 2)
                : 0;
            $student->recording_count = $recordingCount;

            return $student;
        });

        return StudentResource::collection($students);
    }
}
