<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ViolationAppeal extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'appeal_no', 'violation_id', 'appellant_id', 'reason',
        'evidence_attachments', 'status', 'reviewer_id', 'reviewed_at',
        'review_remark', 'fine_waived', 'refund_amount'
    ];

    protected function casts(): array
    {
        return [
            'evidence_attachments' => 'array',
            'reviewed_at' => 'datetime',
            'fine_waived' => 'boolean',
            'refund_amount' => 'decimal:2',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($appeal) {
            if (empty($appeal->appeal_no)) {
                $appeal->appeal_no = 'AP' . date('YmdHis') . Str::random(8);
            }
        });
    }

    public function violation(): BelongsTo
    {
        return $this->belongsTo(ParkingViolation::class, 'violation_id');
    }

    public function appellant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'appellant_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
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
}
