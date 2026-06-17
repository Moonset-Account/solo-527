<?php

namespace App\Services;

use App\Models\NotificationLog;
use App\Models\ReconciliationDifference;
use App\Models\WriteOff;
use App\Models\ProjectPayment;
use App\Models\ProjectInvoice;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class NotificationService
{
    public function __construct(
        protected NotificationLog $notificationLogModel,
        protected ReconciliationDifference $differenceModel,
        protected WriteOff $writeOffModel,
        protected ProjectPayment $paymentModel,
        protected ProjectInvoice $invoiceModel
    ) {}

    public function trackFailure(int $notificationId, string $reason): NotificationLog
    {
        $notification = $this->notificationLogModel->findOrFail($notificationId);

        if (empty($reason)) {
            throw ValidationException::withMessages([
                'reason' => '失败原因不能为空',
            ]);
        }

        return DB::transaction(function () use ($notification, $reason) {
            $notification->update([
                'status' => NotificationLog::STATUS_FAILED,
                'failure_reason' => $reason,
                'failed_at' => now(),
                'retry_count' => $notification->retry_count + 1,
            ]);

            $this->recordFailureMetrics($notification);

            return $notification->fresh()->load('notifiable');
        });
    }

    public function retryNotification(int $notificationId): NotificationLog
    {
        $notification = $this->notificationLogModel->findOrFail($notificationId);

        if (! in_array($notification->status, [
            NotificationLog::STATUS_FAILED,
            NotificationLog::STATUS_PENDING,
        ])) {
            throw ValidationException::withMessages([
                'notification' => '该通知状态不允许重试',
            ]);
        }

        if ($notification->retry_count >= 5) {
            throw ValidationException::withMessages([
                'notification' => '该通知已超过最大重试次数（5次）',
            ]);
        }

        return DB::transaction(function () use ($notification) {
            $notification->update([
                'status' => NotificationLog::STATUS_PENDING,
                'retry_count' => $notification->retry_count + 1,
                'last_retry_at' => now(),
            ]);

            $this->dispatchNotification($notification);

            return $notification->fresh();
        });
    }

    public function getAffectedDocuments(int $notificationId): Collection
    {
        $notification = $this->notificationLogModel->findOrFail($notificationId);
        $documents = collect();

        $relatedData = $notification->related_data ?? [];

        if (! empty($relatedData['difference_ids'])) {
            $differences = $this->differenceModel
                ->whereIn('id', $relatedData['difference_ids'])
                ->with('project', 'statement')
                ->get()
                ->map(function ($diff) {
                    return [
                        'type' => 'reconciliation_difference',
                        'type_label' => '对账差异',
                        'id' => $diff->id,
                        'project_name' => $diff->project->name ?? null,
                        'description' => $diff->description,
                        'amount' => $diff->difference_amount,
                        'status' => $diff->status,
                        'url' => route('differences.show', $diff->id),
                    ];
                });
            $documents = $documents->merge($differences);
        }

        if (! empty($relatedData['write_off_id'])) {
            $writeOff = $this->writeOffModel
                ->with('difference', 'project')
                ->find($relatedData['write_off_id']);
            
            if ($writeOff) {
                $documents->push([
                    'type' => 'write_off',
                    'type_label' => '冲销申请',
                    'id' => $writeOff->id,
                    'project_name' => $writeOff->project->name ?? null,
                    'description' => $writeOff->reason,
                    'amount' => $writeOff->amount,
                    'status' => $writeOff->status,
                    'url' => route('write-offs.show', $writeOff->id),
                ]);
            }
        }

        if (! empty($relatedData['payment_ids'])) {
            $payments = $this->paymentModel
                ->whereIn('id', $relatedData['payment_ids'])
                ->with('project', 'invoice')
                ->get()
                ->map(function ($payment) {
                    return [
                        'type' => 'payment',
                        'type_label' => '付款记录',
                        'id' => $payment->id,
                        'project_name' => $payment->project->name ?? null,
                        'description' => $payment->description,
                        'amount' => $payment->amount,
                        'status' => $payment->status,
                        'url' => route('payments.show', $payment->id),
                    ];
                });
            $documents = $documents->merge($payments);
        }

        if (! empty($relatedData['invoice_ids'])) {
            $invoices = $this->invoiceModel
                ->whereIn('id', $relatedData['invoice_ids'])
                ->with('project')
                ->get()
                ->map(function ($invoice) {
                    return [
                        'type' => 'invoice',
                        'type_label' => '发票',
                        'id' => $invoice->id,
                        'project_name' => $invoice->project->name ?? null,
                        'description' => $invoice->invoice_no,
                        'amount' => $invoice->total_amount,
                        'status' => $invoice->status,
                        'url' => route('invoices.show', $invoice->id),
                    ];
                });
            $documents = $documents->merge($invoices);
        }

        if ($notification->notifiable_type && $notification->notifiable_id) {
            $notifiable = $this->resolveNotifiable($notification->notifiable_type, $notification->notifiable_id);
            
            if ($notifiable && ! $documents->contains('id', $notifiable['id'])) {
                $documents->prepend($notifiable);
            }
        }

        return $documents;
    }

    public function sendNotification(string $type, $notifiable, array $data, array $relatedData = []): NotificationLog
    {
        return DB::transaction(function () use ($type, $notifiable, $data, $relatedData) {
            $notificationLog = $this->notificationLogModel->create([
                'type' => $type,
                'notifiable_type' => get_class($notifiable),
                'notifiable_id' => $notifiable->id,
                'recipient' => $notifiable->email ?? $notifiable->phone ?? null,
                'data' => $data,
                'related_data' => $relatedData,
                'status' => NotificationLog::STATUS_PENDING,
                'sent_by' => auth()->id(),
            ]);

            $this->dispatchNotification($notificationLog);

            return $notificationLog->fresh();
        });
    }

    protected function dispatchNotification(NotificationLog $notification): void
    {
        $notifiable = $notification->notifiable;

        if (! $notifiable) {
            $this->trackFailure($notification->id, '通知接收人不存在');
            return;
        }

        try {
            $notificationClass = $this->resolveNotificationClass($notification->type);
            
            if ($notificationClass && class_exists($notificationClass)) {
                Notification::send($notifiable, new $notificationClass($notification->data));
                $this->markAsSent($notification);
            } else {
                throw new \Exception('通知类不存在: ' . $notification->type);
            }
        } catch (\Exception $e) {
            $this->trackFailure($notification->id, $e->getMessage());
        }
    }

    protected function markAsSent(NotificationLog $notification): void
    {
        $notification->update([
            'status' => NotificationLog::STATUS_SENT,
            'sent_at' => now(),
        ]);
    }

    protected function recordFailureMetrics(NotificationLog $notification): void
    {
        $failuresToday = $this->notificationLogModel
            ->where('recipient', $notification->recipient)
            ->where('status', NotificationLog::STATUS_FAILED)
            ->whereDate('failed_at', today())
            ->count();

        if ($failuresToday >= 3) {
            $notification->update([
                'requires_attention' => true,
                'attention_reason' => '当日失败次数过多（' . $failuresToday . '次）',
            ]);
        }
    }

    protected function resolveNotifiable(string $type, int $id): ?array
    {
        $map = [
            'App\Models\ReconciliationDifference' => [
                'model' => $this->differenceModel,
                'type' => 'reconciliation_difference',
                'type_label' => '对账差异',
            ],
            'App\Models\WriteOff' => [
                'model' => $this->writeOffModel,
                'type' => 'write_off',
                'type_label' => '冲销申请',
            ],
            'App\Models\ProjectPayment' => [
                'model' => $this->paymentModel,
                'type' => 'payment',
                'type_label' => '付款记录',
            ],
            'App\Models\ProjectInvoice' => [
                'model' => $this->invoiceModel,
                'type' => 'invoice',
                'type_label' => '发票',
            ],
        ];

        if (! isset($map[$type])) {
            return null;
        }

        $config = $map[$type];
        $model = $config['model']->with('project')->find($id);

        if (! $model) {
            return null;
        }

        return [
            'type' => $config['type'],
            'type_label' => $config['type_label'],
            'id' => $model->id,
            'project_name' => $model->project->name ?? null,
            'description' => $model->description ?? $model->reason ?? $model->invoice_no ?? '',
            'amount' => $model->amount ?? $model->difference_amount ?? $model->total_amount ?? 0,
            'status' => $model->status,
            'url' => '',
        ];
    }

    protected function resolveNotificationClass(string $type): ?string
    {
        $map = [
            'difference_assigned' => \App\Notifications\DifferenceAssigned::class,
            'difference_escalated' => \App\Notifications\DifferenceEscalated::class,
            'difference_overdue' => \App\Notifications\DifferenceOverdue::class,
            'write_off_created' => \App\Notifications\WriteOffCreated::class,
            'write_off_approved' => \App\Notifications\WriteOffApproved::class,
            'write_off_rejected' => \App\Notifications\WriteOffRejected::class,
            'payment_received' => \App\Notifications\PaymentReceived::class,
            'invoice_issued' => \App\Notifications\InvoiceIssued::class,
            'invoice_overdue' => \App\Notifications\InvoiceOverdue::class,
            'reconciliation_completed' => \App\Notifications\ReconciliationCompleted::class,
        ];

        return $map[$type] ?? null;
    }

    public function batchRetry(array $notificationIds): int
    {
        $successCount = 0;

        DB::transaction(function () use ($notificationIds, &$successCount) {
            foreach ($notificationIds as $id) {
                try {
                    $this->retryNotification($id);
                    $successCount++;
                } catch (\Exception $e) {
                    continue;
                }
            }
        });

        return $successCount;
    }

    public function getFailureStatistics(): array
    {
        $today = today();
        $weekAgo = today()->subDays(7);
        $monthAgo = today()->subDays(30);

        return [
            'today' => [
                'total' => $this->notificationLogModel->whereDate('created_at', $today)->count(),
                'failed' => $this->notificationLogModel->whereDate('failed_at', $today)->count(),
                'success_rate' => $this->calculateSuccessRate($today, $today),
            ],
            'week' => [
                'total' => $this->notificationLogModel->whereDate('created_at', '>=', $weekAgo)->count(),
                'failed' => $this->notificationLogModel->whereDate('failed_at', '>=', $weekAgo)->count(),
                'success_rate' => $this->calculateSuccessRate($weekAgo, $today),
            ],
            'month' => [
                'total' => $this->notificationLogModel->whereDate('created_at', '>=', $monthAgo)->count(),
                'failed' => $this->notificationLogModel->whereDate('failed_at', '>=', $monthAgo)->count(),
                'success_rate' => $this->calculateSuccessRate($monthAgo, $today),
            ],
            'by_type' => $this->notificationLogModel
                ->select('type', DB::raw('count(*) as total'), DB::raw('sum(case when status = "failed" then 1 else 0 end) as failed'))
                ->groupBy('type')
                ->get()
                ->mapWithKeys(function ($item) {
                    return [
                        $item->type => [
                            'total' => $item->total,
                            'failed' => $item->failed,
                            'success_rate' => $item->total > 0 ? round((($item->total - $item->failed) / $item->total) * 100, 2) : 0,
                        ],
                    ];
                }),
            'requires_attention' => $this->notificationLogModel
                ->where('requires_attention', true)
                ->whereNull('resolved_at')
                ->count(),
        ];
    }

    protected function calculateSuccessRate($startDate, $endDate): float
    {
        $total = $this->notificationLogModel
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        if ($total === 0) {
            return 100.0;
        }

        $failed = $this->notificationLogModel
            ->whereBetween('failed_at', [$startDate, $endDate])
            ->count();

        return round((($total - $failed) / $total) * 100, 2);
    }
}
