<?php

namespace App\Policies;

use App\Models\ParentConfirmation;
use App\Models\User;

class ParentConfirmationPolicy
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

    public function view(User $user, ParentConfirmation $parentConfirmation): bool
    {
        if ($user->role === 'teacher') {
            return $parentConfirmation->student->teacher_user_id === $user->id;
        }

        if ($user->role === 'parent') {
            return $parentConfirmation->parent_user_id === $user->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'parent']);
    }
}
