<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ComplianceGap extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'gap_no',
        'checklist_record_id',
        'checklist_item_id',
        'title',
        'description',
        'severity',
        'status',
        'category',
        'responsible_user_id',
        'created_by',
        'closed_by',
        'discovered_date',
        'due_date',
        'closed_date',
        'root_cause',
        'corrective_action',
        'preventive_action',
        'resolution_summary',
        'review_duration_hours',
        'handling_duration_hours',
    ];

    protected $casts = [
        'discovered_date' => 'date',
        'due_date' => 'date',
        'closed_date' => 'date',
    ];

    const STATUS_OPEN = 'open';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_PENDING_REVIEW = 'pending_review';
    const STATUS_RESOLVED = 'resolved';
    const STATUS_CLOSED = 'closed';

    const SEVERITY_LOW = 'low';
    const SEVERITY_MEDIUM = 'medium';
    const SEVERITY_HIGH = 'high';
    const SEVERITY_CRITICAL = 'critical';

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($gap) {
            if (empty($gap->gap_no)) {
                $gap->gap_no = static::generateGapNo();
            }
        });
    }

    public static function generateGapNo(): string
    {
        $prefix = 'GAP-' . date('Ymd');
        $lastGap = static::where('gap_no', 'like', $prefix . '%')
            ->orderBy('gap_no', 'desc')
            ->first();

        if ($lastGap) {
            $num = (int) substr($lastGap->gap_no, -3) + 1;
        } else {
            $num = 1;
        }

        return $prefix . '-' . str_pad($num, 3, '0', STR_PAD_LEFT);
    }

    public function checklistRecord(): BelongsTo
    {
        return $this->belongsTo(ChecklistRecord::class);
    }

    public function checklistItem(): BelongsTo
    {
        return $this->belongsTo(ChecklistItem::class);
    }

    public function responsibleUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsible_user_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function handlingLogs(): HasMany
    {
        return $this->hasMany(GapHandlingLog::class)->orderBy('created_at', 'desc');
    }

    public function evidences(): HasMany
    {
        return $this->hasMany(GapEvidence::class);
    }

    public function reminders(): MorphMany
    {
        return $this->morphMany(ReminderLog::class, 'notifiable');
    }

    public function scopeOpen($query)
    {
        return $query->whereIn('status', [
            self::STATUS_OPEN,
            self::STATUS_IN_PROGRESS,
            self::STATUS_PENDING_REVIEW,
        ]);
    }

    public function scopeClosed($query)
    {
        return $query->whereIn('status', [self::STATUS_RESOLVED, self::STATUS_CLOSED]);
    }

    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now())
            ->open();
    }

    public function scopeDueSoon($query, $days = 7)
    {
        return $query->whereBetween('due_date', [now(), now()->addDays($days)])
            ->open();
    }

    public function isOverdue(): bool
    {
        return $this->due_date && $this->due_date->isPast() && !$this->isClosed();
    }

    public function isClosed(): bool
    {
        return in_array($this->status, [self::STATUS_RESOLVED, self::STATUS_CLOSED]);
    }

    public function getDaysOverdueAttribute(): int
    {
        if (!$this->isOverdue()) {
            return 0;
        }
        return $this->due_date->diffInDays(now());
    }

    public function getDaysUntilDueAttribute(): int
    {
        if ($this->isClosed() || !$this->due_date) {
            return 0;
        }
        return $this->due_date->diffInDays(now(), false);
    }

    public function addHandlingLog(string $actionType, array $data = [], ?int $userId = null): GapHandlingLog
    {
        return $this->handlingLogs()->create([
            'user_id' => $userId ?? auth()->id(),
            'action_type' => $actionType,
            'old_value' => $data['old_value'] ?? null,
            'new_value' => $data['new_value'] ?? null,
            'comment' => $data['comment'] ?? null,
            'metadata' => $data['metadata'] ?? null,
        ]);
    }

    public function updateStatus(string $newStatus, string $comment = null, ?int $userId = null): self
    {
        $oldStatus = $this->status;
        $this->status = $newStatus;

        if ($newStatus === self::STATUS_CLOSED || $newStatus === self::STATUS_RESOLVED) {
            $this->closed_date = now();
            $this->closed_by = $userId ?? auth()->id();
            $this->calculateDurations();
        }

        $this->save();

        $this->addHandlingLog('status_changed', [
            'old_value' => $oldStatus,
            'new_value' => $newStatus,
            'comment' => $comment,
        ], $userId);

        return $this;
    }

    protected function calculateDurations(): void
    {
        $firstStatusLog = $this->handlingLogs()
            ->where('action_type', 'status_changed')
            ->orderBy('created_at')
            ->first();

        if ($firstStatusLog) {
            $this->handling_duration_hours = $firstStatusLog->created_at->diffInHours($this->closed_date);
        }

        $reviewLogs = $this->handlingLogs()
            ->where('action_type', 'status_changed')
            ->where('new_value', self::STATUS_PENDING_REVIEW)
            ->get();

        if ($reviewLogs->isNotEmpty()) {
            $totalReviewHours = 0;
            foreach ($reviewLogs as $log) {
                $nextLog = $this->handlingLogs()
                    ->where('action_type', 'status_changed')
                    ->where('created_at', '>', $log->created_at)
                    ->orderBy('created_at')
                    ->first();

                $endTime = $nextLog ? $nextLog->created_at : $this->closed_date;
                $totalReviewHours += $log->created_at->diffInHours($endTime);
            }
            $this->review_duration_hours = $totalReviewHours;
        }
    }
}
