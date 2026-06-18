<?php

namespace App\Policies;

use App\Models\OperationLog;
use App\Models\User;

class OperationLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, OperationLog $log): bool
    {
        return $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, OperationLog $log): bool
    {
        return false;
    }

    public function delete(User $user, OperationLog $log): bool
    {
        return false;
    }
}
