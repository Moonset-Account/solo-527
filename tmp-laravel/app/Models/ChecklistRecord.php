<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChecklistRecord extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'checklist_id',
        'title',
        'description',
        'status',
        'submitted_by',
        'reviewed_by',
        'responsible_user_id',
        'department',
        'check_date',
        'due_date',
        'submitted_at',
        'reviewed_at',
    ];

    protected $casts = [
        'check_date' => 'date',
        'due_date' => 'date',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    const STATUS_DRAFT = 'draft';
    const STATUS_SUBMITTED = 'submitted';
    const STATUS_REVIEWED = 'reviewed';
    const STATUS_CLOSED = 'closed';

    public function checklist(): BelongsTo
    {
        return $this->belongsTo(Checklist::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ChecklistRecordItem::class);
    }

    public function gaps(): HasMany
    {
        return $this->hasMany(ComplianceGap::class);
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function responsibleUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsible_user_id');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    public function scopeSubmitted($query)
    {
        return $query->where('status', self::STATUS_SUBMITTED);
    }

    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now())
            ->whereIn('status', [self::STATUS_DRAFT, self::STATUS_SUBMITTED]);
    }

    public function isOverdue(): bool
    {
        return $this->due_date && $this->due_date->isPast()
            && in_array($this->status, [self::STATUS_DRAFT, self::STATUS_SUBMITTED]);
    }

    public function getPassCountAttribute()
    {
        return $this->items()->where('result', 'pass')->count();
    }

    public function getFailCountAttribute()
    {
        return $this->items()->where('result', 'fail')->count();
    }

    public function getTotalRequiredCountAttribute()
    {
        return $this->items()->whereHas('checklistItem', function ($q) {
            $q->where('is_required', true);
        })->count();
    }
}
