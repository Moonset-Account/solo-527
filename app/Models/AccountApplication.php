<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'applicant_id',
    'approver_id',
    'application_type',
    'target_system',
    'reason',
    'status',
    'approval_notes',
    'reviewed_at',
])]
class AccountApplication extends Model
{
    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
        ];
    }

    public function applicant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'applicant_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeByApplicant($query, $userId)
    {
        return $query->where('applicant_id', $userId);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('application_type', $type);
    }

    public function scopeSearch($query, $keyword)
    {
        return $query->where(function ($q) use ($keyword) {
            $q->where('reason', 'like', "%{$keyword}%")
                ->orWhere('target_system', 'like', "%{$keyword}%")
                ->orWhereHas('applicant', function ($q2) use ($keyword) {
                    $q2->where('name', 'like', "%{$keyword}%")
                        ->orWhere('email', 'like', "%{$keyword}%");
                });
        });
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function getStatusBadgeClass(): string
    {
        return match ($this->status) {
            'pending' => 'bg-yellow-100 text-yellow-800',
            'approved' => 'bg-green-100 text-green-800',
            'rejected' => 'bg-red-100 text-red-800',
            'cancelled' => 'bg-gray-100 text-gray-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    public function getTypeBadgeClass(): string
    {
        return match ($this->application_type) {
            'new_account' => 'bg-blue-100 text-blue-800',
            'permission_change' => 'bg-purple-100 text-purple-800',
            'access_request' => 'bg-indigo-100 text-indigo-800',
            'password_reset' => 'bg-orange-100 text-orange-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    public function approve(User $approver, string $notes = ''): void
    {
        $this->update([
            'status' => 'approved',
            'approver_id' => $approver->id,
            'approval_notes' => $notes,
            'reviewed_at' => now(),
        ]);

        OperationLog::create([
            'user_id' => $approver->id,
            'action' => 'application_approved',
            'model_type' => AccountApplication::class,
            'model_id' => $this->id,
            'description' => "用户 {$approver->name} 批准了账号申请 #{$this->id}",
            'old_values' => ['status' => $this->getOriginal('status')],
            'new_values' => ['status' => 'approved', 'notes' => $notes],
        ]);
    }

    public function reject(User $approver, string $notes): void
    {
        $this->update([
            'status' => 'rejected',
            'approver_id' => $approver->id,
            'approval_notes' => $notes,
            'reviewed_at' => now(),
        ]);

        OperationLog::create([
            'user_id' => $approver->id,
            'action' => 'application_rejected',
            'model_type' => AccountApplication::class,
            'model_id' => $this->id,
            'description' => "用户 {$approver->name} 拒绝了账号申请 #{$this->id}",
            'old_values' => ['status' => $this->getOriginal('status')],
            'new_values' => ['status' => 'rejected', 'notes' => $notes],
        ]);
    }
}
