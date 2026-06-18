<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'start_time',
    'end_time',
    'type',
    'notes',
    'is_active',
    'created_by',
])]
class DutySchedule extends Model
{
    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeCurrent($query)
    {
        $now = now();
        return $query->where('start_time', '<=', $now)
            ->where('end_time', '>=', $now)
            ->active();
    }

    public function scopeUpcoming($query, $hours = 24)
    {
        $now = now();
        return $query->where('start_time', '>', $now)
            ->where('start_time', '<=', $now->addHours($hours))
            ->active();
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByDateRange($query, $start, $end)
    {
        return $query->where(function ($q) use ($start, $end) {
            $q->whereBetween('start_time', [$start, $end])
                ->orWhereBetween('end_time', [$start, $end])
                ->orWhere(function ($q2) use ($start, $end) {
                    $q2->where('start_time', '<=', $start)
                        ->where('end_time', '>=', $end);
                });
        });
    }

    public function isCurrent(): bool
    {
        $now = now();
        return $this->is_active &&
            $this->start_time <= $now &&
            $this->end_time >= $now;
    }

    public function isUpcoming(): bool
    {
        return $this->is_active && $this->start_time > now();
    }

    public function isPast(): bool
    {
        return $this->end_time < now();
    }

    public function getTypeBadgeClass(): string
    {
        return match ($this->type) {
            'primary' => 'bg-blue-100 text-blue-800',
            'backup' => 'bg-yellow-100 text-yellow-800',
            'on_call' => 'bg-purple-100 text-purple-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    public function getDuration(): string
    {
        return $this->start_time->diffForHumans($this->end_time, true);
    }
}
