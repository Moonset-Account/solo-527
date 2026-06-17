<?php

namespace App\Services;

use App\Models\ReconciliationDifference;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use App\Notifications\DifferenceAssigned;
use App\Notifications\DifferenceEscalated;
use Illuminate\Validation\ValidationException;

class DifferenceService
{
    public function __construct(
        protected ReconciliationDifference $differenceModel,
        protected Project $projectModel,
        protected User $userModel
    ) {}

    public function assignResponsible(int $differenceId, int $userId): ReconciliationDifference
    {
        $difference = $this->differenceModel->findOrFail($differenceId);
        $user = $this->userModel->findOrFail($userId);

        if ($difference->status === ReconciliationDifference::STATUS_RESOLVED) {
            throw ValidationException::withMessages([
                'difference' => '该差异已解决，无法分配责任人',
            ]);
        }

        return DB::transaction(function () use ($difference, $user) {
            $difference->update([
                'responsible_user_id' => $user->id,
                'assigned_at' => now(),
                'assigned_by' => auth()->id(),
                'status' => ReconciliationDifference::STATUS_ASSIGNED,
                'due_date' => now()->addDays(3),
            ]);

            Notification::send($user, new DifferenceAssigned($difference));

            return $difference->load('responsibleUser', 'project');
        });
    }

    public function processDifference(int $differenceId, string $action, ?string $remark = null): ReconciliationDifference
    {
        $difference = $this->differenceModel->findOrFail($differenceId);

        if ($difference->status === ReconciliationDifference::STATUS_RESOLVED) {
            throw ValidationException::withMessages([
                'difference' => '该差异已解决，无法重复处理',
            ]);
        }

        if (! in_array($action, ['accept', 'adjust', 'write_off', 'ignore'])) {
            throw ValidationException::withMessages([
                'action' => '无效的处理动作',
            ]);
        }

        return DB::transaction(function () use ($difference, $action, $remark) {
            switch ($action) {
                case 'accept':
                    $this->acceptDifference($difference);
                    break;
                case 'adjust':
                    $this->adjustDifference($difference);
                    break;
                case 'write_off':
                    $this->initiateWriteOff($difference);
                    break;
                case 'ignore':
                    $this->ignoreDifference($difference, $remark);
                    break;
            }

            $difference->update([
                'processed_by' => auth()->id(),
                'processed_at' => now(),
                'processing_remark' => $remark,
            ]);

            return $difference->fresh();
        });
    }

    public function escalateOverdue(): int
    {
        $overdueDifferences = $this->differenceModel
            ->whereIn('status', [
                ReconciliationDifference::STATUS_ASSIGNED,
                ReconciliationDifference::STATUS_IN_PROGRESS,
            ])
            ->where('due_date', '<', now())
            ->whereNull('escalated_at')
            ->get();

        $escalatedCount = 0;

        DB::transaction(function () use ($overdueDifferences, &$escalatedCount) {
            foreach ($overdueDifferences as $difference) {
                $projectManager = $difference->project->projectManager;
                
                if (! $projectManager) {
                    continue;
                }

                $difference->update([
                    'escalated_at' => now(),
                    'escalated_to' => $projectManager->id,
                    'escalation_level' => 1,
                ]);

                Notification::send($projectManager, new DifferenceEscalated($difference));
                $escalatedCount++;
            }
        });

        return $escalatedCount;
    }

    protected function acceptDifference(ReconciliationDifference $difference): void
    {
        $difference->update([
            'status' => ReconciliationDifference::STATUS_RESOLVED,
            'resolution_type' => 'accept',
            'resolved_at' => now(),
        ]);

        if ($difference->payment_id) {
            $difference->payment->update([
                'is_reconciled' => true,
                'reconciled_at' => now(),
            ]);
        }
    }

    protected function adjustDifference(ReconciliationDifference $difference): void
    {
        $difference->update([
            'status' => ReconciliationDifference::STATUS_IN_PROGRESS,
            'resolution_type' => 'adjust',
        ]);
    }

    protected function initiateWriteOff(ReconciliationDifference $difference): void
    {
        $difference->update([
            'status' => ReconciliationDifference::STATUS_PENDING_WRITE_OFF,
            'resolution_type' => 'write_off',
        ]);
    }

    protected function ignoreDifference(ReconciliationDifference $difference, ?string $remark): void
    {
        if (empty($remark)) {
            throw ValidationException::withMessages([
                'remark' => '忽略差异必须填写备注说明',
            ]);
        }

        $difference->update([
            'status' => ReconciliationDifference::STATUS_RESOLVED,
            'resolution_type' => 'ignore',
            'resolved_at' => now(),
        ]);
    }
}
