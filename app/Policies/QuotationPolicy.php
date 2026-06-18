<?php

namespace App\Policies;

use App\Enums\PermissionName;
use App\Enums\QuotationStatus;
use App\Models\Quotation;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class QuotationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(PermissionName::VIEW_QUOTATIONS->value);
    }

    public function view(User $user, Quotation $quotation): bool
    {
        if ($user->can(PermissionName::VIEW_ALL_QUOTATIONS->value)) {
            return true;
        }
        if ($user->isSupplier() && $user->supplier_id === $quotation->supplier_id) {
            return true;
        }
        if ($quotation->purchaseRequest && $quotation->purchaseRequest->requester_id === $user->id) {
            return true;
        }
        return $user->can(PermissionName::VIEW_QUOTATIONS->value);
    }

    public function create(User $user): bool
    {
        return $user->can(PermissionName::CREATE_QUOTATIONS->value) || $user->isSupplier();
    }

    public function update(User $user, Quotation $quotation): bool
    {
        if (!$quotation->canEdit()) {
            return false;
        }
        if ($user->isSupplier() && $user->supplier_id === $quotation->supplier_id) {
            return true;
        }
        return $user->can(PermissionName::EDIT_QUOTATIONS->value);
    }

    public function delete(User $user, Quotation $quotation): bool
    {
        if (!$quotation->isDraft()) {
            return false;
        }
        if ($user->isSupplier() && $user->supplier_id === $quotation->supplier_id) {
            return true;
        }
        return $user->can(PermissionName::DELETE_QUOTATIONS->value);
    }

    public function submit(User $user, Quotation $quotation): bool
    {
        if (!$quotation->canSubmit()) {
            return false;
        }
        if ($user->isSupplier() && $user->supplier_id === $quotation->supplier_id) {
            return true;
        }
        return $user->can(PermissionName::SUBMIT_QUOTATIONS->value);
    }

    public function review(User $user, Quotation $quotation): bool
    {
        if (!in_array($quotation->status, [QuotationStatus::SUBMITTED, QuotationStatus::UNDER_REVIEW])) {
            return false;
        }
        return $user->can(PermissionName::REVIEW_QUOTATIONS->value);
    }

    public function approve(User $user, Quotation $quotation): bool
    {
        if (!in_array($quotation->status, [QuotationStatus::UNDER_REVIEW, QuotationStatus::FINANCIAL_REVIEW])) {
            return false;
        }
        return $user->can(PermissionName::APPROVE_QUOTATIONS->value);
    }

    public function reject(User $user, Quotation $quotation): bool
    {
        if (!in_array($quotation->status, [QuotationStatus::SUBMITTED, QuotationStatus::UNDER_REVIEW, QuotationStatus::FINANCIAL_REVIEW])) {
            return false;
        }
        return $user->can(PermissionName::REJECT_QUOTATIONS->value);
    }

    public function select(User $user, Quotation $quotation): bool
    {
        if ($quotation->status !== QuotationStatus::APPROVED) {
            return false;
        }
        return $user->can(PermissionName::SELECT_QUOTATIONS->value);
    }
}
