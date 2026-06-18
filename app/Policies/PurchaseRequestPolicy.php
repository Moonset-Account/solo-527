<?php

namespace App\Policies;

use App\Enums\PermissionName;
use App\Enums\PurchaseRequestStatus;
use App\Models\PurchaseRequest;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class PurchaseRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(PermissionName::VIEW_PURCHASE_REQUESTS->value);
    }

    public function view(User $user, PurchaseRequest $purchaseRequest): bool
    {
        if ($user->can(PermissionName::VIEW_ALL_PURCHASE_REQUESTS->value)) {
            return true;
        }
        if ($purchaseRequest->requester_id === $user->id) {
            return true;
        }
        if ($user->can(PermissionName::APPROVE_PURCHASE_REQUESTS->value) &&
            $purchaseRequest->isPendingApproval()) {
            return true;
        }
        return $user->can(PermissionName::VIEW_PURCHASE_REQUESTS->value) &&
            $purchaseRequest->department === $user->department;
    }

    public function create(User $user): bool
    {
        return $user->can(PermissionName::CREATE_PURCHASE_REQUESTS->value);
    }

    public function update(User $user, PurchaseRequest $purchaseRequest): bool
    {
        if (!$purchaseRequest->canEdit()) {
            return false;
        }
        return $purchaseRequest->requester_id === $user->id ||
            $user->can(PermissionName::EDIT_PURCHASE_REQUESTS->value);
    }

    public function delete(User $user, PurchaseRequest $purchaseRequest): bool
    {
        if (!$purchaseRequest->isDraft()) {
            return false;
        }
        return $purchaseRequest->requester_id === $user->id ||
            $user->can(PermissionName::DELETE_PURCHASE_REQUESTS->value);
    }

    public function submit(User $user, PurchaseRequest $purchaseRequest): bool
    {
        if (!$purchaseRequest->canSubmit()) {
            return false;
        }
        return $purchaseRequest->requester_id === $user->id ||
            $user->can(PermissionName::SUBMIT_PURCHASE_REQUESTS->value);
    }

    public function cancel(User $user, PurchaseRequest $purchaseRequest): bool
    {
        if (!$purchaseRequest->canCancel()) {
            return false;
        }
        return $purchaseRequest->requester_id === $user->id ||
            $user->can(PermissionName::CANCEL_PURCHASE_REQUESTS->value);
    }

    public function approve(User $user, PurchaseRequest $purchaseRequest): bool
    {
        if (!$purchaseRequest->isPendingApproval()) {
            return false;
        }
        return $user->can(PermissionName::APPROVE_PURCHASE_REQUESTS->value);
    }

    public function reject(User $user, PurchaseRequest $purchaseRequest): bool
    {
        if (!$purchaseRequest->isPendingApproval()) {
            return false;
        }
        return $user->can(PermissionName::REJECT_PURCHASE_REQUESTS->value);
    }
}
