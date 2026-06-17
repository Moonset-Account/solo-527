<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\AssistanceRequest;
use App\Models\User;

class AssistanceRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, AssistanceRequest $assistanceRequest): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [UserRole::Resident, UserRole::Representative]);
    }

    public function update(User $user, AssistanceRequest $assistanceRequest): bool
    {
        return in_array($user->role, [UserRole::Admin, UserRole::Department]);
    }

    public function delete(User $user, AssistanceRequest $assistanceRequest): bool
    {
        return $user->role === UserRole::Admin;
    }
}
