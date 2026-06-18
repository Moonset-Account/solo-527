<?php

namespace App\Policies;

use App\Enums\PermissionName;
use App\Models\ApprovalFlow;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ApprovalFlowPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(PermissionName::VIEW_APPROVAL_FLOWS->value);
    }

    public function view(User $user, ApprovalFlow $approvalFlow): bool
    {
        return $user->can(PermissionName::VIEW_APPROVAL_FLOWS->value);
    }

    public function create(User $user): bool
    {
        return $user->can(PermissionName::CREATE_APPROVAL_FLOWS->value);
    }

    public function update(User $user, ApprovalFlow $approvalFlow): bool
    {
        return $user->can(PermissionName::EDIT_APPROVAL_FLOWS->value);
    }

    public function delete(User $user, ApprovalFlow $approvalFlow): bool
    {
        return $user->can(PermissionName::DELETE_APPROVAL_FLOWS->value);
    }

    public function manageSteps(User $user): bool
    {
        return $user->can(PermissionName::MANAGE_APPROVAL_STEPS->value);
    }
}
