<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\PublicNotice;
use App\Models\User;

class PublicNoticePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, PublicNotice $publicNotice): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [UserRole::Admin, UserRole::Department]);
    }

    public function update(User $user, PublicNotice $publicNotice): bool
    {
        return in_array($user->role, [UserRole::Admin, UserRole::Department]);
    }

    public function delete(User $user, PublicNotice $publicNotice): bool
    {
        return $user->role === UserRole::Admin;
    }
}
