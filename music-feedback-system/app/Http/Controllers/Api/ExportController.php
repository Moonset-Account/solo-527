<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\PaymentReminder;
use App\Models\PracticeRecording;
use App\Models\Student;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function assignments(Request $request): StreamedResponse
    {
        $this->authorize('export', Assignment::class);

        $query = Assignment::with(['student', 'piece']);

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
            $student = \App\Models\Student::find($request->student_id);
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

        $assignments = $query->get();

        return response()->streamDownload(function () use ($assignments) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['id', 'student_name', 'piece_title', 'title', 'status', 'due_date', 'bpm', 'created_at']);

            foreach ($assignments as $assignment) {
                fputcsv($handle, [
                    $assignment->id,
                    $assignment->student?->name,
                    $assignment->piece?->title,
                    $assignment->title,
                    $assignment->status,
                    $assignment->due_date,
                    $assignment->bpm_requirement,
                    $assignment->created_at,
                ]);
            }

            fclose($handle);
        }, 'assignments.csv', ['Content-Type' => 'text/csv']);
    }

    public function recordings(Request $request): StreamedResponse
    {
        $this->authorize('export', PracticeRecording::class);

        $query = PracticeRecording::with(['student', 'assignment']);

        $user = $request->user();
        if ($user->role === 'teacher') {
            $studentIds = Student::where('teacher_user_id', $user->id)->pluck('id');
            $query->whereIn('student_id', $studentIds);
        }

        if ($request->filled('student_id')) {
            if ($user->role === 'teacher') {
                $student = Student::find($request->student_id);
                if ($student && $student->teacher_user_id === $user->id) {
                    $query->where('student_id', $request->student_id);
                }
            } else {
                $query->where('student_id', $request->student_id);
            }
        }

        if ($request->filled('assignment_id')) {
            $query->where('assignment_id', $request->assignment_id);
        }

        $recordings = $query->get();

        return response()->streamDownload(function () use ($recordings) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['id', 'student_name', 'assignment_title', 'duration', 'note', 'created_at']);

            foreach ($recordings as $recording) {
                fputcsv($handle, [
                    $recording->id,
                    $recording->student?->name,
                    $recording->assignment?->title,
                    $recording->duration_seconds,
                    $recording->note,
                    $recording->created_at,
                ]);
            }

            fclose($handle);
        }, 'recordings.csv', ['Content-Type' => 'text/csv']);
    }

    public function payments(Request $request): StreamedResponse
    {
        $this->authorize('exportPayments', PaymentReminder::class);

        $query = PaymentReminder::with(['student']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->filled('due_date_from')) {
            $query->where('due_date', '>=', $request->due_date_from);
        }

        if ($request->filled('due_date_to')) {
            $query->where('due_date', '<=', $request->due_date_to);
        }

        $payments = $query->get();

        return response()->streamDownload(function () use ($payments) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['id', 'student_name', 'amount', 'due_date', 'status', 'created_at']);

            foreach ($payments as $payment) {
                fputcsv($handle, [
                    $payment->id,
                    $payment->student?->name,
                    $payment->amount,
                    $payment->due_date,
                    $payment->status,
                    $payment->created_at,
                ]);
            }

            fclose($handle);
        }, 'payments.csv', ['Content-Type' => 'text/csv']);
    }
}
