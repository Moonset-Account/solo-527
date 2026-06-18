<?php

namespace App\Services;

use App\Enums\ApprovalStatus;
use App\Enums\PurchaseRequestStatus;
use App\Enums\QuotationStatus;
use App\Models\ApprovalFlow;
use App\Models\ApprovalFlowStep;
use App\Models\ApprovalRecord;
use App\Models\PurchaseRequest;
use App\Models\Quotation;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ApprovalService
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function getApplicableFlow(string $entityType, float $amount, ?string $department = null): ?ApprovalFlow
    {
        $query = ApprovalFlow::active()
            ->forEntity($entityType)
            ->forAmount($amount);

        if ($department) {
            $query->where(function ($q) use ($department) {
                $q->whereNull('department')->orWhere('department', $department);
            });
        }

        return $query->first() ?? ApprovalFlow::active()->default()->forEntity($entityType)->first();
    }

    public function startApproval(PurchaseRequest $purchaseRequest, User $submitter): PurchaseRequest
    {
        return DB::transaction(function () use ($purchaseRequest, $submitter) {
            $flow = $this->getApplicableFlow('purchase_request', $purchaseRequest->total_amount, $purchaseRequest->department);

            if (!$flow || !$flow->hasSteps()) {
                throw new \Exception('未找到适用的审批流程');
            }

            $firstStep = $flow->getFirstStep();

            $purchaseRequest->update([
                'approval_flow_id' => $flow->id,
                'current_step_id' => $firstStep?->id,
                'status' => PurchaseRequestStatus::PENDING_APPROVAL,
                'submitted_at' => now(),
            ]);

            $this->createApprovalRecord($purchaseRequest, $firstStep);

            $this->notificationService->notifyApprovalPending($purchaseRequest, $firstStep);

            return $purchaseRequest->fresh();
        });
    }

    public function startQuotationApproval(Quotation $quotation, User $submitter): Quotation
    {
        return DB::transaction(function () use ($quotation, $submitter) {
            $flow = $this->getApplicableFlow('quotation', $quotation->final_amount);

            if (!$flow || !$flow->hasSteps()) {
                $quotation->update([
                    'status' => QuotationStatus::UNDER_REVIEW,
                    'submitted_at' => now(),
                ]);
                return $quotation->fresh();
            }

            $firstStep = $flow->getFirstStep();

            $quotation->update([
                'status' => QuotationStatus::UNDER_REVIEW,
                'submitted_at' => now(),
            ]);

            return $quotation->fresh();
        });
    }

    public function approvePurchaseRequest(PurchaseRequest $purchaseRequest, User $approver, string $comment = ''): PurchaseRequest
    {
        return DB::transaction(function () use ($purchaseRequest, $approver, $comment) {
            $currentStep = $purchaseRequest->currentStep;

            if (!$currentStep) {
                throw new \Exception('当前审批步骤不存在');
            }

            $record = ApprovalRecord::where('purchase_request_id', $purchaseRequest->id)
                ->where('step_id', $currentStep->id)
                ->where('approver_id', $approver->id)
                ->where('status', ApprovalStatus::PENDING)
                ->firstOrFail();

            $record->approve($comment);

            $nextStep = $currentStep->flow->getNextStep($currentStep->step_order);

            if ($nextStep) {
                $purchaseRequest->update([
                    'current_step_id' => $nextStep->id,
                ]);
                $this->createApprovalRecord($purchaseRequest, $nextStep);
                $this->notificationService->notifyApprovalPending($purchaseRequest, $nextStep);
            } else {
                $purchaseRequest->update([
                    'status' => PurchaseRequestStatus::APPROVED,
                    'approved_at' => now(),
                ]);
                $this->notificationService->notifyApprovalCompleted($purchaseRequest);
            }

            $this->notificationService->notifyApprovalAction($record, $approver);

            return $purchaseRequest->fresh();
        });
    }

    public function rejectPurchaseRequest(PurchaseRequest $purchaseRequest, User $approver, string $reason): PurchaseRequest
    {
        return DB::transaction(function () use ($purchaseRequest, $approver, $reason) {
            $currentStep = $purchaseRequest->currentStep;

            if (!$currentStep) {
                throw new \Exception('当前审批步骤不存在');
            }

            $record = ApprovalRecord::where('purchase_request_id', $purchaseRequest->id)
                ->where('step_id', $currentStep->id)
                ->where('approver_id', $approver->id)
                ->where('status', ApprovalStatus::PENDING)
                ->firstOrFail();

            $record->reject($reason);

            $purchaseRequest->update([
                'status' => PurchaseRequestStatus::REJECTED,
                'rejection_reason' => $reason,
            ]);

            $this->notificationService->notifyApprovalRejected($purchaseRequest, $approver, $reason);

            return $purchaseRequest->fresh();
        });
    }

    protected function createApprovalRecord(PurchaseRequest $purchaseRequest, ApprovalFlowStep $step): void
    {
        $approvers = $step->getApprovers();

        foreach ($approvers as $approver) {
            ApprovalRecord::create([
                'purchase_request_id' => $purchaseRequest->id,
                'step_id' => $step->id,
                'approver_id' => $approver->id,
                'status' => ApprovalStatus::PENDING,
            ]);
        }
    }

    public function getPendingApprovalsForUser(User $user): \Illuminate\Database\Eloquent\Builder
    {
        return ApprovalRecord::where('approver_id', $user->id)
            ->where('status', ApprovalStatus::PENDING)
            ->with(['purchaseRequest', 'quotation', 'step', 'purchaseRequest.requester']);
    }

    public function getApprovalHistory(PurchaseRequest $purchaseRequest): \Illuminate\Database\Eloquent\Collection
    {
        return $purchaseRequest->approvalRecords()
            ->with(['approver', 'step'])
            ->orderBy('created_at')
            ->get();
    }

    public function canUserApprove(User $user, PurchaseRequest $purchaseRequest): bool
    {
        if (!$purchaseRequest->isPendingApproval()) {
            return false;
        }

        $currentStep = $purchaseRequest->currentStep;
        if (!$currentStep) {
            return false;
        }

        return ApprovalRecord::where('purchase_request_id', $purchaseRequest->id)
            ->where('step_id', $currentStep->id)
            ->where('approver_id', $user->id)
            ->where('status', ApprovalStatus::PENDING)
            ->exists();
    }

    public function delegateApproval(PurchaseRequest $purchaseRequest, User $fromUser, User $toUser, string $reason = ''): bool
    {
        $currentStep = $purchaseRequest->currentStep;
        if (!$currentStep || !$currentStep->can_delegate) {
            return false;
        }

        $record = ApprovalRecord::where('purchase_request_id', $purchaseRequest->id)
            ->where('step_id', $currentStep->id)
            ->where('approver_id', $fromUser->id)
            ->where('status', ApprovalStatus::PENDING)
            ->first();

        if (!$record) {
            return false;
        }

        $record->update([
            'approver_id' => $toUser->id,
            'delegated_from_id' => $fromUser->id,
            'comment' => $reason ? "委派原因: {$reason}" : null,
        ]);

        $this->notificationService->notifyApprovalDelegated($purchaseRequest, $fromUser, $toUser);

        return true;
    }
}
