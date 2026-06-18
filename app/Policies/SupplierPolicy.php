<?php

namespace App\Policies;

use App\Enums\PermissionName;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class SupplierPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(PermissionName::VIEW_SUPPLIERS->value);
    }

    public function view(User $user, Supplier $supplier): bool
    {
        if ($user->isSupplier() && $user->supplier_id === $supplier->id) {
            return true;
        }
        return $user->can(PermissionName::VIEW_SUPPLIERS->value);
    }

    public function create(User $user): bool
    {
        return $user->can(PermissionName::CREATE_SUPPLIERS->value);
    }

    public function update(User $user, Supplier $supplier): bool
    {
        if ($user->isSupplier() && $user->supplier_id === $supplier->id) {
            return true;
        }
        return $user->can(PermissionName::EDIT_SUPPLIERS->value);
    }

    public function delete(User $user, Supplier $supplier): bool
    {
        return $user->can(PermissionName::DELETE_SUPPLIERS->value);
    }

    public function manageRisk(User $user): bool
    {
        return $user->can(PermissionName::MANAGE_SUPPLIER_RISK->value);
    }

    public function viewRiskLogs(User $user): bool
    {
        return $user->can(PermissionName::VIEW_SUPPLIER_RISK_LOGS->value);
    }
}
