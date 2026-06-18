<?php

namespace App\Services;

use App\Enums\PurchaseRequestStatus;
use App\Models\PurchaseRequest;
use App\Models\User;

class ProcurementService
{
    public function getPurchaseRequestStats(?User $user = null): array
    {
        $query = PurchaseRequest::query();

        if ($user && !$user->isAdmin() && !$user->isProcurementStaff()) {
            $query->where('requester_id', $user->id);
        }

        return [
            'total' => (clone $query)->count(),
            'draft' => (clone $query)->where('status', PurchaseRequestStatus::DRAFT->value)->count(),
            'pending_approval' => (clone $query)->where('status', PurchaseRequestStatus::PENDING_APPROVAL->value)->count(),
            'approved' => (clone $query)->where('status', PurchaseRequestStatus::APPROVED->value)->count(),
            'rejected' => (clone $query)->where('status', PurchaseRequestStatus::REJECTED->value)->count(),
            'completed' => (clone $query)->where('status', PurchaseRequestStatus::COMPLETED->value)->count(),
            'total_amount' => (clone $query)->whereIn('status', [
                PurchaseRequestStatus::APPROVED->value,
                PurchaseRequestStatus::COMPLETED->value,
            ])->sum('total_amount'),
        ];
    }
}
