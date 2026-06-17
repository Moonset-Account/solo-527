<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\ExceptionLog;
use App\Models\User;

class ExceptionLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === UserRole::Admin;
    }

    public function view(User $user, ExceptionLog $exceptionLog): bool
    {
        return $user->role === UserRole::Admin;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Admin;
    }

    public function update(User $user, ExceptionLog $exceptionLog): bool
    {
        return $user->role === UserRole::Admin;
    }

    public function delete(User $user, ExceptionLog $exceptionLog): bool
    {
        return $user->role === UserRole::Admin;
    }
}
