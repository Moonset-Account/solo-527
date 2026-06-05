<?php

namespace App\Policies;

use App\Models\Student;
use App\Models\User;

class StudentPolicy
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

    public function view(User $user, Student $student): bool
    {
        if ($user->role === 'teacher') {
            return $student->teacher_user_id === $user->id;
        }

        if ($user->role === 'parent') {
            return $student->parent_user_id === $user->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'teacher']);
    }

    public function update(User $user, Student $student): bool
    {
        if ($user->role === 'teacher') {
            return $student->teacher_user_id === $user->id;
        }

        return false;
    }

    public function delete(User $user, Student $student): bool
    {
        return false;
    }
}
