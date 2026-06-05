<?php

namespace App\Policies;

use App\Models\ApprovalFlow;
use App\Models\User;

class ApprovalFlowPolicy
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
        return in_array($user->role, ['admin', 'teacher']);
    }

    public function view(User $user, ApprovalFlow $approvalFlow): bool
    {
        if ($user->role === 'teacher') {
            return $approvalFlow->approver_user_id === $user->id;
        }

        return false;
    }

    public function approve(User $user, ApprovalFlow $approvalFlow): bool
    {
        return false;
    }

    public function reject(User $user, ApprovalFlow $approvalFlow): bool
    {
        return false;
    }

    public function withdraw(User $user, ApprovalFlow $approvalFlow): bool
    {
        if ($user->role === 'teacher') {
            return $approvalFlow->approver_user_id === $user->id;
        }

        return false;
    }
}
