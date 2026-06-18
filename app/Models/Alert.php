<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Cast;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'title',
    'description',
    'level',
    'status',
    'source',
    'server_ip',
    'service',
    'hostname',
    'tags',
    'metadata',
    'acknowledged_by',
    'processed_by',
    'closed_by',
    'acknowledged_at',
    'processed_at',
    'closed_at',
    'escalated_at',
    'escalation_level',
    'is_inspected',
    'inspected_at',
    'inspected_by',
    'resolution',
])]
class Alert extends Model
{
    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'acknowledged_at' => 'datetime',
            'processed_at' => 'datetime',
            'closed_at' => 'datetime',
            'escalated_at' => 'datetime',
            'inspected_at' => 'datetime',
            'is_inspected' => 'boolean',
            'escalation_level' => 'integer',
        ];
    }

    public function acknowledgedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acknowledged_by');
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function inspectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspected_by');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(AlertComment::class)->latest();
    }

    public function inspectionRecords(): HasMany
    {
        return $this->hasMany(InspectionRecord::class);
    }

    public function scopeOpen($query)
    {
        return $query->whereIn('status', ['open', 'acknowledged', 'processing']);
    }

    public function scopeClosed($query)
    {
        return $query->whereIn('status', ['resolved', 'closed']);
    }

    public function scopeCritical($query)
    {
        return $query->where('level', 'critical');
    }

    public function scopeByLevel($query, $level)
    {
        return $query->where('level', $level);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByServerIp($query, $ip)
    {
        return $query->where('server_ip', $ip);
    }

    public function scopeByDateRange($query, $start, $end)
    {
        return $query->whereBetween('created_at', [$start, $end]);
    }

    public function scopeSearch($query, $keyword)
    {
        return $query->where(function ($q) use ($keyword) {
            $q->where('title', 'like', "%{$keyword}%")
                ->orWhere('description', 'like', "%{$keyword}%")
                ->orWhere('server_ip', 'like', "%{$keyword}%")
                ->orWhere('service', 'like', "%{$keyword}%")
                ->orWhere('hostname', 'like', "%{$keyword}%")
                ->orWhere('tags', 'like', "%{$keyword}%");
        });
    }

    public function scopeNotInspected($query)
    {
        return $query->where('is_inspected', false);
    }

    public function isOpen(): bool
    {
        return in_array($this->status, ['open', 'acknowledged', 'processing']);
    }

    public function isAcknowledged(): bool
    {
        return $this->status === 'acknowledged';
    }

    public function isProcessing(): bool
    {
        return $this->status === 'processing';
    }

    public function isClosed(): bool
    {
        return in_array($this->status, ['resolved', 'closed']);
    }

    public function getLevelBadgeClass(): string
    {
        return match ($this->level) {
            'critical' => 'bg-red-100 text-red-800',
            'warning' => 'bg-yellow-100 text-yellow-800',
            'info' => 'bg-blue-100 text-blue-800',
            'debug' => 'bg-gray-100 text-gray-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    public function getStatusBadgeClass(): string
    {
        return match ($this->status) {
            'open' => 'bg-red-100 text-red-800',
            'acknowledged' => 'bg-yellow-100 text-yellow-800',
            'processing' => 'bg-blue-100 text-blue-800',
            'resolved' => 'bg-green-100 text-green-800',
            'closed' => 'bg-gray-100 text-gray-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    public function getTagsArray(): array
    {
        return $this->tags ? explode(',', $this->tags) : [];
    }

    public function acknowledge(User $user): void
    {
        $this->update([
            'status' => 'acknowledged',
            'acknowledged_by' => $user->id,
            'acknowledged_at' => now(),
        ]);

        OperationLog::create([
            'user_id' => $user->id,
            'action' => 'alert_acknowledged',
            'model_type' => Alert::class,
            'model_id' => $this->id,
            'description' => "用户 {$user->name} 确认了告警 #{$this->id}: {$this->title}",
            'old_values' => ['status' => $this->getOriginal('status')],
            'new_values' => ['status' => 'acknowledged'],
        ]);
    }

    public function startProcessing(User $user): void
    {
        $this->update([
            'status' => 'processing',
            'processed_by' => $user->id,
            'processed_at' => now(),
        ]);

        OperationLog::create([
            'user_id' => $user->id,
            'action' => 'alert_processing',
            'model_type' => Alert::class,
            'model_id' => $this->id,
            'description' => "用户 {$user->name} 开始处理告警 #{$this->id}",
            'old_values' => ['status' => $this->getOriginal('status')],
            'new_values' => ['status' => 'processing'],
        ]);
    }

    public function resolve(User $user, string $resolution): void
    {
        $this->update([
            'status' => 'resolved',
            'closed_by' => $user->id,
            'closed_at' => now(),
            'resolution' => $resolution,
        ]);

        OperationLog::create([
            'user_id' => $user->id,
            'action' => 'alert_resolved',
            'model_type' => Alert::class,
            'model_id' => $this->id,
            'description' => "用户 {$user->name} 解决了告警 #{$this->id}",
            'old_values' => ['status' => $this->getOriginal('status')],
            'new_values' => ['status' => 'resolved', 'resolution' => $resolution],
        ]);
    }

    public function close(User $user): void
    {
        $this->update([
            'status' => 'closed',
            'closed_by' => $user->id,
            'closed_at' => now(),
        ]);

        OperationLog::create([
            'user_id' => $user->id,
            'action' => 'alert_closed',
            'model_type' => Alert::class,
            'model_id' => $this->id,
            'description' => "用户 {$user->name} 关闭了告警 #{$this->id}",
            'old_values' => ['status' => $this->getOriginal('status')],
            'new_values' => ['status' => 'closed'],
        ]);
    }

    public function escalate(int $level, string $reason): void
    {
        $this->update([
            'escalation_level' => $level,
            'escalated_at' => now(),
        ]);

        OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'alert_escalated',
            'model_type' => Alert::class,
            'model_id' => $this->id,
            'description' => "告警 #{$this->id} 已升级到级别 {$level}",
            'new_values' => ['escalation_level' => $level, 'reason' => $reason],
        ]);
    }

    public function markInspected(User $user, bool $wasMissed = false, ?string $missedReason = null): void
    {
        $this->update([
            'is_inspected' => true,
            'inspected_at' => now(),
            'inspected_by' => $user->id,
        ]);

        InspectionRecord::create([
            'alert_id' => $this->id,
            'user_id' => $user->id,
            'check_item' => $this->title,
            'status' => $wasMissed ? 'missed' : 'pass',
            'was_missed' => $wasMissed,
            'missed_reason' => $missedReason,
            'checked_at' => now(),
        ]);

        if ($wasMissed) {
            OperationLog::create([
                'user_id' => $user->id,
                'action' => 'inspection_missed',
                'model_type' => Alert::class,
                'model_id' => $this->id,
                'description' => "巡检遗漏记录: 告警 #{$this->id} - {$missedReason}",
                'new_values' => ['was_missed' => true, 'reason' => $missedReason],
            ]);
        }
    }
}
