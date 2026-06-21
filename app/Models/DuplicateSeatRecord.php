<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class DuplicateSeatRecord extends Model
{
    use HasFactory, SoftDeletes;

    const STATUSES = [
        'pending' => '待处理',
        'processing' => '处理中',
        'resolved_keep_first' => '保留最早',
        'resolved_keep_last' => '保留最晚',
        'resolved_merge' => '合并保留',
        'resolved_cancel_all' => '全部取消',
        'resolved_manual' => '人工处理',
        'closed' => '已关闭',
    ];

    const CONFLICT_TYPES = [
        'seat' => '座位冲突',
        'phone' => '手机号重复',
        'company' => '公司重复',
        'person' => '人员重复',
    ];

    protected $fillable = [
        'event_id', 'session_id', 'seat_id', 'phone', 'company',
        'conflict_type', 'conflict_reason', 'conflict_registration_ids',
        'conflict_details', 'status', 'resolution_note', 'final_registration_id',
        'assigned_to', 'resolved_at', 'resolved_by', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'conflict_registration_ids' => 'array',
            'conflict_details' => 'array',
            'resolved_at' => 'datetime',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(EventSession::class, 'session_id');
    }

    public function seat(): BelongsTo
    {
        return $this->belongsTo(EventSeat::class);
    }

    public function finalRegistration(): BelongsTo
    {
        return $this->belongsTo(Registration::class, 'final_registration_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getConflictRegistrations(): \Illuminate\Database\Eloquent\Collection
    {
        return Registration::whereIn('id', $this->conflict_registration_ids ?? [])->get();
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isProcessing(): bool
    {
        return $this->status === 'processing';
    }

    public function isResolved(): bool
    {
        return str_starts_with($this->status, 'resolved_') || $this->status === 'closed';
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending')->orWhere('status', 'processing');
    }

    public function scopeResolved($query)
    {
        return $query->where(function ($q) {
            $q->where('status', 'like', 'resolved_%')
                ->orWhere('status', 'closed');
        });
    }
}
