<?php

namespace App\Policies;

use App\Models\Assignment;
use App\Models\User;

class AssignmentPolicy
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

    public function view(User $user, Assignment $assignment): bool
    {
        if ($user->role === 'teacher') {
            return $assignment->teacher_user_id === $user->id;
        }

        if ($user->role === 'parent') {
            return $assignment->student->parent_user_id === $user->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'teacher']);
    }

    public function update(User $user, Assignment $assignment): bool
    {
        if ($user->role === 'teacher') {
            return $assignment->teacher_user_id === $user->id;
        }

        return false;
    }

    public function delete(User $user, Assignment $assignment): bool
    {
        if ($user->role === 'teacher') {
            return $assignment->teacher_user_id === $user->id;
        }

        return false;
    }

    public function publish(User $user, Assignment $assignment): bool
    {
        if ($user->role === 'teacher') {
            return $assignment->teacher_user_id === $user->id;
        }

        return false;
    }

    public function submit(User $user, Assignment $assignment): bool
    {
        if ($user->role === 'parent') {
            return $assignment->student->parent_user_id === $user->id;
        }

        return false;
    }

    public function withdraw(User $user, Assignment $assignment): bool
    {
        if ($user->role === 'teacher') {
            return $assignment->teacher_user_id === $user->id;
        }

        return false;
    }

    public function export(User $user): bool
    {
        return in_array($user->role, ['admin', 'teacher']);
    }
}
