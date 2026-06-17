<?php

namespace App\Services;

use App\Models\WriteOff;
use App\Models\ReconciliationDifference;
use App\Models\Project;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use App\Notifications\WriteOffCreated;
use App\Notifications\WriteOffApproved;
use App\Notifications\WriteOffRejected;
use Illuminate\Validation\ValidationException;

class WriteOffService
{
    public function __construct(
        protected WriteOff $writeOffModel,
        protected ReconciliationDifference $differenceModel,
        protected Project $projectModel
    ) {}

    public function createWriteOff(int $differenceId, float $amount, string $reason): WriteOff
    {
        $difference = $this->differenceModel->findOrFail($differenceId);

        if ($difference->status !== ReconciliationDifference::STATUS_PENDING_WRITE_OFF) {
            throw ValidationException::withMessages([
                'difference' => '该差异未处于待冲销状态，无法创建冲销申请',
            ]);
        }

        if ($amount <= 0) {
            throw ValidationException::withMessages([
                'amount' => '冲销金额必须大于0',
            ]);
        }

        if (abs($amount) > abs($difference->difference_amount)) {
            throw ValidationException::withMessages([
                'amount' => '冲销金额不能超过差异金额',
            ]);
        }

        if (empty($reason)) {
            throw ValidationException::withMessages([
                'reason' => '冲销原因不能为空',
            ]);
        }

        return DB::transaction(function () use ($difference, $amount, $reason) {
            $writeOff = $this->writeOffModel->create([
                'difference_id' => $difference->id,
                'project_id' => $difference->project_id,
                'amount' => $amount,
                'reason' => $reason,
                'status' => WriteOff::STATUS_PENDING,
                'created_by' => auth()->id(),
            ]);

            $difference->update([
                'status' => ReconciliationDifference::STATUS_WRITE_OFF_PENDING_APPROVAL,
                'write_off_id' => $writeOff->id,
            ]);

            $approvers = $this->getWriteOffApprovers($writeOff);
            Notification::send($approvers, new WriteOffCreated($writeOff));

            return $writeOff->load('difference', 'project', 'createdBy');
        });
    }

    public function approveWriteOff(int $writeOffId): WriteOff
    {
        $writeOff = $this->writeOffModel->findOrFail($writeOffId);

        if ($writeOff->status !== WriteOff::STATUS_PENDING) {
            throw ValidationException::withMessages([
                'writeOff' => '该冲销申请状态不正确，无法审批',
            ]);
        }

        if (! $this->canApprove($writeOff)) {
            throw ValidationException::withMessages([
                'writeOff' => '您没有权限审批该冲销申请',
            ]);
        }

        return DB::transaction(function () use ($writeOff) {
            $writeOff->update([
                'status' => WriteOff::STATUS_APPROVED,
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);

            $this->postWriteOffEntries($writeOff);

            $writeOff->difference->update([
                'status' => ReconciliationDifference::STATUS_RESOLVED,
                'resolution_type' => 'write_off',
                'resolved_at' => now(),
            ]);

            Notification::send($writeOff->createdBy, new WriteOffApproved($writeOff));

            return $writeOff->fresh()->load('difference', 'approvedBy');
        });
    }

    public function rejectWriteOff(int $writeOffId, string $reason): WriteOff
    {
        $writeOff = $this->writeOffModel->findOrFail($writeOffId);

        if ($writeOff->status !== WriteOff::STATUS_PENDING) {
            throw ValidationException::withMessages([
                'writeOff' => '该冲销申请状态不正确，无法驳回',
            ]);
        }

        if (empty($reason)) {
            throw ValidationException::withMessages([
                'reason' => '驳回原因不能为空',
            ]);
        }

        return DB::transaction(function () use ($writeOff, $reason) {
            $writeOff->update([
                'status' => WriteOff::STATUS_REJECTED,
                'rejection_reason' => $reason,
                'rejected_by' => auth()->id(),
                'rejected_at' => now(),
            ]);

            $writeOff->difference->update([
                'status' => ReconciliationDifference::STATUS_ASSIGNED,
                'write_off_id' => null,
            ]);

            Notification::send($writeOff->createdBy, new WriteOffRejected($writeOff, $reason));

            return $writeOff->fresh()->load('difference', 'rejectedBy');
        });
    }

    protected function getWriteOffApprovers(WriteOff $writeOff): \Illuminate\Support\Collection
    {
        $project = $writeOff->project;
        $approvers = collect();

        if ($writeOff->amount < 10000) {
            $approvers->push($project->projectManager);
        } elseif ($writeOff->amount < 100000) {
            $approvers->push($project->projectManager);
            $approvers->push($project->departmentHead);
        } else {
            $approvers->push($project->projectManager);
            $approvers->push($project->departmentHead);
            $approvers->push($project->financeDirector);
        }

        return $approvers->filter();
    }

    protected function canApprove(WriteOff $writeOff): bool
    {
        $approvers = $this->getWriteOffApprovers($writeOff);
        $currentUserId = auth()->id();

        return $approvers->contains('id', $currentUserId);
    }

    protected function postWriteOffEntries(WriteOff $writeOff): void
    {
        $difference = $writeOff->difference;

        $difference->project->journalEntries()->create([
            'entry_type' => 'write_off',
            'reference_id' => $writeOff->id,
            'debit_account' => '坏账损失',
            'credit_account' => '应收账款',
            'amount' => $writeOff->amount,
            'description' => '差异冲销: ' . $writeOff->reason,
            'posted_by' => auth()->id(),
            'posted_at' => now(),
        ]);
    }
}
