<?php

namespace App\Services;

use App\Enums\ConfigKey;
use App\Models\Quotation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    public function __construct(protected ConfigService $configService) {}

    protected function shouldSendEmail(): bool
    {
        return $this->configService->getBoolean(ConfigKey::NOTIFICATION_EMAIL_ENABLED);
    }

    protected function shouldSendSms(): bool
    {
        return $this->configService->getBoolean(ConfigKey::NOTIFICATION_SMS_ENABLED);
    }

    protected function sendNotification(User $user, string $type, string $title, string $message, array $data = []): void
    {
        try {
            DB::table('notifications')->insert([
                'id' => \Illuminate\Support\Str::uuid(),
                'type' => $type,
                'notifiable_type' => User::class,
                'notifiable_id' => $user->id,
                'data' => json_encode(array_merge($data, [
                    'title' => $title,
                    'message' => $message,
                ])),
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if ($this->shouldSendEmail() && $user->email) {
                $this->sendEmail($user, $title, $message);
            }

            if ($this->shouldSendSms() && $user->phone) {
                $this->sendSms($user, $message);
            }
        } catch (\Exception $e) {
            Log::error('Notification send failed: ' . $e->getMessage());
        }
    }

    protected function sendEmail(User $user, string $subject, string $message): void
    {
        try {
            Mail::raw($message, function ($mail) use ($user, $subject) {
                $mail->to($user->email)
                    ->subject($subject);
            });
        } catch (\Exception $e) {
            Log::error('Email send failed: ' . $e->getMessage());
        }
    }

    protected function sendSms(User $user, string $message): void
    {
        Log::info("SMS to {$user->phone}: {$message}");
    }

    public function sendViaChannel(string $channel, array $recipients, string $title, string $content, array $data = []): bool
    {
        try {
            $recipientUsers = User::whereIn('email', $recipients)
                ->orWhereIn('id', $recipients)
                ->get();

            foreach ($recipientUsers as $user) {
                $this->sendNotification($user, $channel, $title, $content, $data);
            }

            return true;
        } catch (\Exception $e) {
            Log::error("Send via channel [{$channel}] failed: " . $e->getMessage());
            return false;
        }
    }

    public function sendQuotationExpiryNotification(Quotation $quotation, int $daysLeft): void
    {
        $financialUsers = User::whereHas('roles', function ($q) {
            $q->whereIn('name', [
                \App\Enums\RoleName::FINANCIAL_MANAGER->value,
                \App\Enums\RoleName::FINANCIAL_STAFF->value,
            ]);
        })->get();

        $isExpired = $daysLeft <= 0;
        $title = $isExpired ? '报价已过期提醒' : '报价即将过期提醒';
        $message = $isExpired
            ? "报价单 #{$quotation->id} 已过期，请及时处理。金额: ¥{$quotation->total_amount}"
            : "报价单 #{$quotation->id} 将在 {$daysLeft} 天后过期，请及时复核。金额: ¥{$quotation->total_amount}";

        foreach ($financialUsers as $user) {
            $this->sendNotification($user, 'quotation_expiry', $title, $message, [
                'quotation_id' => $quotation->id,
                'days_left' => $daysLeft,
                'is_expired' => $isExpired,
            ]);
        }
    }

    public function notifyApprovalPending(\App\Models\PurchaseRequest $purchaseRequest, \App\Models\ApprovalFlowStep $step): void
    {
        $approvers = $step->approvers ?? collect();
        if ($approvers->isEmpty() && $step->role) {
            $approvers = User::role($step->role->name)->get();
        }

        $title = '采购申请待审批';
        $message = "采购申请 #{$purchaseRequest->id} 等待您的审批。申请金额: ¥{$purchaseRequest->total_amount}";

        foreach ($approvers as $approver) {
            $this->sendNotification($approver, 'approval_pending', $title, $message, [
                'purchase_request_id' => $purchaseRequest->id,
                'step_id' => $step->id,
            ]);
        }
    }

    public function notifyApprovalAction(\App\Models\ApprovalRecord $record, User $approver): void
    {
        $purchaseRequest = $record->purchaseRequest;
        if (!$purchaseRequest || !$purchaseRequest->requester) {
            return;
        }

        $status = $record->status === 'approved' ? '已通过' : '已拒绝';
        $title = "采购申请{$status}";
        $message = "您的采购申请 #{$purchaseRequest->id} 已被 {$approver->name} {$status}。";

        $this->sendNotification($purchaseRequest->requester, 'approval_action', $title, $message, [
            'purchase_request_id' => $purchaseRequest->id,
            'status' => $record->status,
        ]);
    }

    public function notifyApprovalCompleted(\App\Models\PurchaseRequest $purchaseRequest): void
    {
        if (!$purchaseRequest->requester) {
            return;
        }

        $title = '采购申请已完成审批';
        $message = "您的采购申请 #{$purchaseRequest->id} 已完成全部审批流程。";

        $this->sendNotification($purchaseRequest->requester, 'approval_completed', $title, $message, [
            'purchase_request_id' => $purchaseRequest->id,
        ]);
    }

    public function notifyApprovalRejected(\App\Models\PurchaseRequest $purchaseRequest, User $approver, string $reason): void
    {
        if (!$purchaseRequest->requester) {
            return;
        }

        $title = '采购申请已被拒绝';
        $message = "您的采购申请 #{$purchaseRequest->id} 已被 {$approver->name} 拒绝。原因: {$reason}";

        $this->sendNotification($purchaseRequest->requester, 'approval_rejected', $title, $message, [
            'purchase_request_id' => $purchaseRequest->id,
        ]);
    }

    public function notifyApprovalDelegated(\App\Models\PurchaseRequest $purchaseRequest, User $fromUser, User $toUser): void
    {
        $title = '审批已委派';
        $message = "采购申请 #{$purchaseRequest->id} 的审批已由 {$fromUser->name} 委派给您。";

        $this->sendNotification($toUser, 'approval_delegated', $title, $message, [
            'purchase_request_id' => $purchaseRequest->id,
        ]);
    }

    public function notifySupplierRiskChanged(\App\Models\Supplier $supplier, User $operator): void
    {
        $adminUsers = User::whereHas('roles', function ($q) {
            $q->whereIn('name', [
                \App\Enums\RoleName::SUPER_ADMIN->value,
                \App\Enums\RoleName::ADMIN->value,
                \App\Enums\RoleName::PROCUREMENT_MANAGER->value,
            ]);
        })->get();

        $title = '供应商风险等级变更';
        $message = "供应商 {$supplier->name} 的风险等级已变更为 {$supplier->risk_level}。操作人: {$operator->name}";

        foreach ($adminUsers as $user) {
            $this->sendNotification($user, 'supplier_risk_changed', $title, $message, [
                'supplier_id' => $supplier->id,
                'new_risk_level' => $supplier->risk_level,
            ]);
        }
    }

    public function notifyBatchCompleted(\App\Models\FailedBatch $batch): void
    {
        if (!$batch->creator) {
            return;
        }

        $status = in_array($batch->status, ['completed', 'partially_completed']) ? '已完成' : '失败';
        $title = "批量任务{$status}";
        $message = "批量任务 {$batch->batch_number} 处理{$status}。";

        $this->sendNotification($batch->creator, 'batch_completed', $title, $message, [
            'batch_id' => $batch->id,
            'batch_number' => $batch->batch_number,
        ]);
    }

    public function notifyBatchRetryCompleted(\App\Models\FailedBatch $batch, \App\Models\RetryLog $retryLog): void
    {
        if (!$batch->creator) {
            return;
        }

        $status = $retryLog->status === 'completed' ? '已完成' : '失败';
        $title = "批量任务重试{$status}";
        $message = "批量任务 {$batch->batch_number} 第 {$retryLog->retry_number} 次重试{$status}。";

        $this->sendNotification($batch->creator, 'batch_retry_completed', $title, $message, [
            'batch_id' => $batch->id,
            'batch_number' => $batch->batch_number,
            'retry_number' => $retryLog->retry_number,
        ]);
    }
}
