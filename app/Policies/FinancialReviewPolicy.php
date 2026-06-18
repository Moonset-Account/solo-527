<?php

namespace App\Policies;

use App\Enums\PermissionName;
use App\Models\FinancialReview;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class FinancialReviewPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(PermissionName::VIEW_FINANCIAL_REVIEWS->value);
    }

    public function view(User $user, FinancialReview $financialReview): bool
    {
        return $user->can(PermissionName::VIEW_FINANCIAL_REVIEWS->value);
    }

    public function create(User $user): bool
    {
        return $user->can(PermissionName::CREATE_FINANCIAL_REVIEWS->value);
    }

    public function review(User $user): bool
    {
        return $user->can(PermissionName::REVIEW_FINANCIALLY->value);
    }

    public function approve(User $user, FinancialReview $financialReview): bool
    {
        if (!$financialReview->isPending()) {
            return false;
        }
        return $user->can(PermissionName::APPROVE_FINANCIALLY->value);
    }

    public function reject(User $user, FinancialReview $financialReview): bool
    {
        if (!$financialReview->isPending()) {
            return false;
        }
        return $user->can(PermissionName::REJECT_FINANCIALLY->value);
    }
}
