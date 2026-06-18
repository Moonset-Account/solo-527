<?php

namespace App\Policies;

use App\Models\AccountApplication;
use App\Models\User;

class AccountApplicationPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, AccountApplication $application): bool
    {
        return $user->isAdmin() || $user->id === $application->applicant_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, AccountApplication $application): bool
    {
        return $user->isAdmin() && $application->isPending();
    }

    public function delete(User $user, AccountApplication $application): bool
    {
        return $user->isAdmin() || $user->id === $application->applicant_id;
    }
}
