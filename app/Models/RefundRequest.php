<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class RefundRequest extends Model
{
    use HasFactory, SoftDeletes;

    const STATUSES = [
        'pending' => '待审核',
        'approved' => '已通过待处理',
        'rejected' => '已拒绝',
        'processing' => '退款处理中',
        'completed' => '退款完成',
        'cancelled' => '已取消',
    ];

    protected $fillable = [
        'registration_id', 'event_id', 'refund_no', 'requested_amount',
        'actual_amount', 'reason', 'applicant_name', 'applicant_phone',
        'refund_method', 'refund_account', 'status', 'review_note',
        'process_note', 'reviewed_at', 'completed_at', 'reviewed_by',
        'processed_by', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'requested_amount' => 'decimal:2',
            'actual_amount' => 'decimal:2',
            'reviewed_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $refund) {
            if (empty($refund->refund_no)) {
                $refund->refund_no = 'TK' . date('YmdHis') . str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
            }
        });
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function canReview(): bool
    {
        return $this->status === 'pending';
    }

    public function canProcess(): bool
    {
        return $this->status === 'approved';
    }

    public function getStatusTextAttribute(): string
    {
        return static::STATUSES[$this->status] ?? $this->status;
    }
}
