<?php

namespace App\Policies;

use App\Enums\IssueStatus;
use App\Enums\UserRole;
use App\Models\Issue;
use App\Models\User;

class IssuePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Issue $issue): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [UserRole::Resident, UserRole::Representative]);
    }

    public function vote(User $user, Issue $issue): bool
    {
        return in_array($user->role, [UserRole::Resident, UserRole::Representative])
            && $issue->status === IssueStatus::Voting;
    }

    public function assign(User $user, Issue $issue): bool
    {
        return $user->role === UserRole::Admin;
    }

    public function update(User $user, Issue $issue): bool
    {
        return in_array($user->role, [UserRole::Admin, UserRole::Department]);
    }

    public function delete(User $user, Issue $issue): bool
    {
        return $user->role === UserRole::Admin;
    }
}
