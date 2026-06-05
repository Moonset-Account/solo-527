<?php

namespace App\Policies;

use App\Models\SavedFilter;
use App\Models\User;

class SavedFilterPolicy
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
        return true;
    }

    public function view(User $user, SavedFilter $savedFilter): bool
    {
        return $savedFilter->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, SavedFilter $savedFilter): bool
    {
        return $savedFilter->user_id === $user->id;
    }

    public function delete(User $user, SavedFilter $savedFilter): bool
    {
        return $savedFilter->user_id === $user->id;
    }
}
