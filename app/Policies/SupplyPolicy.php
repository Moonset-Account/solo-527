<?php

namespace App\Policies;

use App\Enums\PermissionName;
use App\Models\Supply;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class SupplyPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(PermissionName::VIEW_SUPPLIES->value);
    }

    public function view(User $user, Supply $supply): bool
    {
        return $user->can(PermissionName::VIEW_SUPPLIES->value);
    }

    public function create(User $user): bool
    {
        return $user->can(PermissionName::CREATE_SUPPLIES->value);
    }

    public function update(User $user, Supply $supply): bool
    {
        return $user->can(PermissionName::EDIT_SUPPLIES->value);
    }

    public function delete(User $user, Supply $supply): bool
    {
        return $user->can(PermissionName::DELETE_SUPPLIES->value);
    }

    public function manageCategories(User $user): bool
    {
        return $user->can(PermissionName::MANAGE_SUPPLY_CATEGORIES->value);
    }
}
