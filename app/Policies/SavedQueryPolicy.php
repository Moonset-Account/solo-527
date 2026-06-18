<?php

namespace App\Policies;

use App\Models\SavedQuery;
use App\Models\User;

class SavedQueryPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, SavedQuery $query): bool
    {
        return $query->is_public || $user->id === $query->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, SavedQuery $query): bool
    {
        return $user->id === $query->user_id;
    }

    public function delete(User $user, SavedQuery $query): bool
    {
        return $user->id === $query->user_id || $user->isAdmin();
    }
}
