<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'title',
    'description',
    'start_time',
    'end_time',
    'type',
    'priority',
    'status',
    'change_request_id',
    'affected_systems',
    'rollback_plan',
    'created_by',
    'approved_by',
    'approved_at',
])]
class ChangeWindow extends Model
{
    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function scopeActive($query)
    {
        $now = now();
        return $query->where('start_time', '<=', $now)
            ->where('end_time', '>=', $now)
            ->where('status', 'in_progress');
    }

    public function scopeUpcoming($query, $hours = 24)
    {
        $now = now();
        return $query->where('start_time', '>', $now)
            ->where('start_time', '<=', $now->addHours($hours))
            ->whereNotIn('status', ['cancelled', 'completed', 'failed']);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeByDateRange($query, $start, $end)
    {
        return $query->where(function ($q) use ($start, $end) {
            $q->whereBetween('start_time', [$start, $end])
                ->orWhereBetween('end_time', [$start, $end]);
        });
    }

    public function scopeSearch($query, $keyword)
    {
        return $query->where(function ($q) use ($keyword) {
            $q->where('title', 'like', "%{$keyword}%")
                ->orWhere('description', 'like', "%{$keyword}%")
                ->orWhere('change_request_id', 'like', "%{$keyword}%")
                ->orWhere('affected_systems', 'like', "%{$keyword}%");
        });
    }

    public function isActive(): bool
    {
        $now = now();
        return $this->status === 'in_progress' &&
            $this->start_time <= $now &&
            $this->end_time >= $now;
    }

    public function isUpcoming(): bool
    {
        return $this->start_time > now() &&
            ! in_array($this->status, ['cancelled', 'completed', 'failed']);
    }

    public function isPast(): bool
    {
        return $this->end_time < now();
    }

    public function getStatusBadgeClass(): string
    {
        return match ($this->status) {
            'scheduled' => 'bg-blue-100 text-blue-800',
            'in_progress' => 'bg-yellow-100 text-yellow-800',
            'completed' => 'bg-green-100 text-green-800',
            'cancelled' => 'bg-gray-100 text-gray-800',
            'failed' => 'bg-red-100 text-red-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    public function getPriorityBadgeClass(): string
    {
        return match ($this->priority) {
            'critical' => 'bg-red-100 text-red-800',
            'high' => 'bg-orange-100 text-orange-800',
            'medium' => 'bg-yellow-100 text-yellow-800',
            'low' => 'bg-green-100 text-green-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    public function getTypeBadgeClass(): string
    {
        return match ($this->type) {
            'planned' => 'bg-blue-100 text-blue-800',
            'emergency' => 'bg-red-100 text-red-800',
            'routine' => 'bg-gray-100 text-gray-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    public function getAffectedSystemsArray(): array
    {
        return $this->affected_systems ? explode(',', $this->affected_systems) : [];
    }

    public function getDuration(): string
    {
        return $this->start_time->diffForHumans($this->end_time, true);
    }

    public function approve(User $approver): void
    {
        $this->update([
            'approved_by' => $approver->id,
            'approved_at' => now(),
        ]);

        OperationLog::create([
            'user_id' => $approver->id,
            'action' => 'change_window_approved',
            'model_type' => ChangeWindow::class,
            'model_id' => $this->id,
            'description' => "用户 {$approver->name} 批准了变更窗口 #{$this->id}: {$this->title}",
            'new_values' => ['approved_by' => $approver->id],
        ]);
    }

    public function start(): void
    {
        $this->update(['status' => 'in_progress']);

        OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'change_window_started',
            'model_type' => ChangeWindow::class,
            'model_id' => $this->id,
            'description' => "变更窗口 #{$this->id} 已开始",
            'old_values' => ['status' => $this->getOriginal('status')],
            'new_values' => ['status' => 'in_progress'],
        });
    }

    public function complete(): void
    {
        $this->update(['status' => 'completed']);

        OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'change_window_completed',
            'model_type' => ChangeWindow::class,
            'model_id' => $this->id,
            'description' => "变更窗口 #{$this->id} 已完成",
            'old_values' => ['status' => $this->getOriginal('status')],
            'new_values' => ['status' => 'completed'],
        });
    }

    public function cancel(string $reason): void
    {
        $this->update(['status' => 'cancelled']);

        OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'change_window_cancelled',
            'model_type' => ChangeWindow::class,
            'model_id' => $this->id,
            'description' => "变更窗口 #{$this->id} 已取消: {$reason}",
            'old_values' => ['status' => $this->getOriginal('status')],
            'new_values' => ['status' => 'cancelled', 'reason' => $reason],
        });
    }
}
