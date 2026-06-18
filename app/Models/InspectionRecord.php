<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'alert_id',
    'user_id',
    'check_item',
    'status',
    'notes',
    'check_details',
    'checked_at',
    'was_missed',
    'missed_reason',
])]
class InspectionRecord extends Model
{
    protected function casts(): array
    {
        return [
            'check_details' => 'array',
            'checked_at' => 'datetime',
            'was_missed' => 'boolean',
        ];
    }

    public function alert(): BelongsTo
    {
        return $this->belongsTo(Alert::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeByAlert($query, $alertId)
    {
        return $query->where('alert_id', $alertId);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeMissed($query)
    {
        return $query->where('was_missed', true);
    }

    public function scopeByDateRange($query, $start, $end)
    {
        return $query->whereBetween('created_at', [$start, $end]);
    }

    public function scopeSearch($query, $keyword)
    {
        return $query->where(function ($q) use ($keyword) {
            $q->where('check_item', 'like', "%{$keyword}%")
                ->orWhere('notes', 'like', "%{$keyword}%")
                ->orWhere('missed_reason', 'like', "%{$keyword}%");
        });
    }

    public function isPass(): bool
    {
        return $this->status === 'pass';
    }

    public function isFail(): bool
    {
        return $this->status === 'fail';
    }

    public function isWarning(): bool
    {
        return $this->status === 'warning';
    }

    public function isMissed(): bool
    {
        return $this->was_missed || $this->status === 'missed';
    }

    public function isSkipped(): bool
    {
        return $this->status === 'skipped';
    }

    public function getStatusBadgeClass(): string
    {
        return match ($this->status) {
            'pass' => 'bg-green-100 text-green-800',
            'fail' => 'bg-red-100 text-red-800',
            'warning' => 'bg-yellow-100 text-yellow-800',
            'skipped' => 'bg-gray-100 text-gray-800',
            'missed' => 'bg-red-100 text-red-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    public function getCheckDetail($key, $default = null)
    {
        return $this->check_details[$key] ?? $default;
    }
}
