<?php

namespace App\Policies;

use App\Models\Annotation;
use App\Models\User;

class AnnotationPolicy
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
        return in_array($user->role, ['admin', 'teacher', 'parent']);
    }

    public function view(User $user, Annotation $annotation): bool
    {
        if ($user->role === 'teacher') {
            return true;
        }

        if ($user->role === 'parent') {
            return $annotation->practiceRecording->student->parent_user_id === $user->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'teacher']);
    }

    public function update(User $user, Annotation $annotation): bool
    {
        if ($user->role === 'teacher') {
            return $annotation->teacher_user_id === $user->id;
        }

        return false;
    }

    public function delete(User $user, Annotation $annotation): bool
    {
        if ($user->role === 'teacher') {
            return $annotation->teacher_user_id === $user->id;
        }

        return false;
    }
}
