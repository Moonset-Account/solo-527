<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\GridEvent;
use App\Models\User;

class GridEventPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, GridEvent $gridEvent): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [UserRole::Resident, UserRole::Representative]);
    }

    public function update(User $user, GridEvent $gridEvent): bool
    {
        return in_array($user->role, [UserRole::Admin, UserRole::Department]);
    }

    public function delete(User $user, GridEvent $gridEvent): bool
    {
        return $user->role === UserRole::Admin;
    }
}
