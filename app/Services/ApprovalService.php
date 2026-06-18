<?php

namespace App\Services;

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
            $flow = $this->getApplicableFlow('purchase_request', (float)$purchaseRequest->total_amount, $purchaseRequest->department);

            if (!$flow || !$flow->hasSteps()) {
                throw new \Exception('未找到适用的审批流程');
            }

            $steps = $flow->steps()->orderBy('step_order')->get();
            $firstStep = $steps->first();
            $totalSteps = $steps->count();

            $purchaseRequest->update([
                'flow_id' => $flow->id,
                'current_step' => $firstStep?->id,
                'total_steps' => $totalSteps,
                'status' => PurchaseRequestStatus::PENDING_APPROVAL,
                'created_by' => $submitter->id,
                'updated_by' => $submitter->id,
            ]);

            $this->createApprovalRecord($purchaseRequest, $firstStep);

            if (method_exists($this->notificationService, 'notifyApprovalPending')) {
                $this->notificationService->notifyApprovalPending($purchaseRequest, $firstStep);
            }

            return $purchaseRequest->fresh();
        });
    }

    public function startQuotationApproval(Quotation $quotation, User $submitter): Quotation
    {
        return DB::transaction(function () use ($quotation, $submitter) {
            $flow = $this->getApplicableFlow('quotation', (float)$quotation->total_amount);

            if (!$flow || !$flow->hasSteps()) {
                $quotation->update([
                    'status' => QuotationStatus::UNDER_REVIEW,
                ]);
                return $quotation->fresh();
            }

            $steps = $flow->steps()->orderBy('step_order')->get();
            $firstStep = $steps->first();
            $totalSteps = $steps->count();

            $quotation->update([
                'flow_id' => $flow->id,
                'total_steps' => $totalSteps,
                'status' => QuotationStatus::UNDER_REVIEW,
                'created_by' => $submitter->id,
                'updated_by' => $submitter->id,
            ]);

            $this->createEntityRecord($quotation, $firstStep);

            return $quotation->fresh();
        });
    }

    public function approvePurchaseRequest(PurchaseRequest $purchaseRequest, User $approver, string $comment = ''): PurchaseRequest
    {
        return DB::transaction(function () use ($purchaseRequest, $approver, $comment) {
            $currentStepId = $purchaseRequest->current_step;
            if (!$currentStepId) {
                throw new \Exception('当前审批步骤不存在');
            }

            $record = ApprovalRecord::forEntity('purchase_request', $purchaseRequest->id)
                ->where('flow_step_id', $currentStepId)
                ->where('approver_id', $approver->id)
                ->where('status', 'pending')
                ->firstOrFail();

            $record->approver_name = $approver->name;
            $record->ip_address = request()->ip();
            $record->user_agent = request()->userAgent();
            $record->approve($comment);

            $currentStep = ApprovalFlowStep::find($currentStepId);
            $nextStep = null;
            if ($currentStep) {
                $nextStep = ApprovalFlow::find($purchaseRequest->flow_id)
                    ?->steps()
                    ->where('step_order', '>', $currentStep->step_order)
                    ->orderBy('step_order')
                    ->first();
            }

            if ($nextStep) {
                $purchaseRequest->update([
                    'current_step' => $nextStep->id,
                    'updated_by' => $approver->id,
                ]);
                $this->createApprovalRecord($purchaseRequest, $nextStep);
                if (method_exists($this->notificationService, 'notifyApprovalPending')) {
                    $this->notificationService->notifyApprovalPending($purchaseRequest, $nextStep);
                }
            } else {
                $purchaseRequest->update([
                    'status' => PurchaseRequestStatus::APPROVED,
                    'current_step' => null,
                    'approved_by' => $approver->id,
                    'approved_at' => now(),
                    'updated_by' => $approver->id,
                ]);
                if (method_exists($this->notificationService, 'notifyApprovalCompleted')) {
                    $this->notificationService->notifyApprovalCompleted($purchaseRequest);
                }
            }

            return $purchaseRequest->fresh();
        });
    }

    public function rejectPurchaseRequest(PurchaseRequest $purchaseRequest, User $approver, string $reason): PurchaseRequest
    {
        return DB::transaction(function () use ($purchaseRequest, $approver, $reason) {
            $currentStepId = $purchaseRequest->current_step;
            if (!$currentStepId) {
                throw new \Exception('当前审批步骤不存在');
            }

            $record = ApprovalRecord::forEntity('purchase_request', $purchaseRequest->id)
                ->where('flow_step_id', $currentStepId)
                ->where('approver_id', $approver->id)
                ->where('status', 'pending')
                ->firstOrFail();

            $record->approver_name = $approver->name;
            $record->ip_address = request()->ip();
            $record->user_agent = request()->userAgent();
            $record->reject($reason);

            $purchaseRequest->update([
                'status' => PurchaseRequestStatus::REJECTED,
                'current_step' => null,
                'rejected_by' => $approver->id,
                'reject_reason' => $reason,
                'rejected_at' => now(),
                'updated_by' => $approver->id,
            ]);

            if (method_exists($this->notificationService, 'notifyApprovalRejected')) {
                $this->notificationService->notifyApprovalRejected($purchaseRequest, $approver, $reason);
            }

            return $purchaseRequest->fresh();
        });
    }

    protected function createApprovalRecord(PurchaseRequest $purchaseRequest, ?ApprovalFlowStep $step): void
    {
        if (!$step) {
            return;
        }

        $approvers = $step->getApprovers();

        foreach ($approvers as $approver) {
            ApprovalRecord::create([
                'entity_type' => 'purchase_request',
                'entity_id' => $purchaseRequest->id,
                'flow_id' => $purchaseRequest->flow_id,
                'flow_step_id' => $step->id,
                'step_order' => $step->step_order,
                'step_name' => $step->step_name,
                'approver_type' => $step->approver_type,
                'approver_id' => $approver->id,
                'approver_name' => $approver->name,
                'status' => 'pending',
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);
        }
    }

    protected function createEntityRecord(Quotation $quotation, ?ApprovalFlowStep $step): void
    {
        if (!$step) {
            return;
        }

        $approvers = $step->getApprovers();

        foreach ($approvers as $approver) {
            ApprovalRecord::create([
                'entity_type' => 'quotation',
                'entity_id' => $quotation->id,
                'flow_id' => $quotation->flow_id,
                'flow_step_id' => $step->id,
                'step_order' => $step->step_order,
                'step_name' => $step->step_name,
                'approver_type' => $step->approver_type,
                'approver_id' => $approver->id,
                'approver_name' => $approver->name,
                'status' => 'pending',
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);
        }
    }

    public function getPendingApprovalsForUser(User $user): \Illuminate\Database\Eloquent\Builder
    {
        return ApprovalRecord::where('approver_id', $user->id)
            ->where('status', 'pending')
            ->with(['purchaseRequest', 'quotation', 'flowStep', 'approver']);
    }

    public function getApprovalHistory(PurchaseRequest $purchaseRequest): \Illuminate\Database\Eloquent\Collection
    {
        return ApprovalRecord::forEntity('purchase_request', $purchaseRequest->id)
            ->with(['approver', 'flowStep'])
            ->orderBy('created_at')
            ->get();
    }

    public function canUserApprove(User $user, PurchaseRequest $purchaseRequest): bool
    {
        if (!$purchaseRequest->isPendingApproval()) {
            return false;
        }

        $currentStepId = $purchaseRequest->current_step;
        if (!$currentStepId) {
            return false;
        }

        return ApprovalRecord::forEntity('purchase_request', $purchaseRequest->id)
            ->where('flow_step_id', $currentStepId)
            ->where('approver_id', $user->id)
            ->where('status', 'pending')
            ->exists();
    }

    public function delegateApproval(PurchaseRequest $purchaseRequest, User $fromUser, User $toUser, string $reason = ''): bool
    {
        $currentStepId = $purchaseRequest->current_step;
        if (!$currentStepId) {
            return false;
        }

        $currentStep = ApprovalFlowStep::find($currentStepId);
        if (!$currentStep || !$currentStep->can_delegate) {
            return false;
        }

        $record = ApprovalRecord::forEntity('purchase_request', $purchaseRequest->id)
            ->where('flow_step_id', $currentStepId)
            ->where('approver_id', $fromUser->id)
            ->where('status', 'pending')
            ->first();

        if (!$record) {
            return false;
        }

        $record->transfer($toUser->id, $reason);

        if (method_exists($this->notificationService, 'notifyApprovalDelegated')) {
            $this->notificationService->notifyApprovalDelegated($purchaseRequest, $fromUser, $toUser);
        }

        return true;
    }
}
