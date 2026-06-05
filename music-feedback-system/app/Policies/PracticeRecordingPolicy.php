<?php

namespace App\Policies;

use App\Models\PracticeRecording;
use App\Models\User;

class PracticeRecordingPolicy
{
    public function before(User $user, string $ability): bool|null
    {
        if ($user->role === 'admin') {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'teacher']);
    }

    public function view(User $user, PracticeRecording $practiceRecording): bool
    {
        if ($user->role === 'teacher') {
            return $practiceRecording->student->teacher_user_id === $user->id;
        }

        if ($user->role === 'parent') {
            return $practiceRecording->student->parent_user_id === $user->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'teacher', 'parent']);
    }

    public function delete(User $user, PracticeRecording $practiceRecording): bool
    {
        if ($user->role === 'teacher') {
            return true;
        }

        return false;
    }

    public function export(User $user): bool
    {
        return in_array($user->role, ['admin', 'teacher']);
    }
}
