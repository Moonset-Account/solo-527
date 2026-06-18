<?php

namespace App\Policies;

use App\Models\ChangeWindow;
use App\Models\User;

class ChangeWindowPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, ChangeWindow $window): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, ChangeWindow $window): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, ChangeWindow $window): bool
    {
        return $user->isAdmin();
    }
}
