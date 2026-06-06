<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'channel',
        'title',
        'content',
        'data',
        'status',
        'retry_count',
        'max_retries',
        'error_message',
        'sent_at',
        'last_retry_at',
        'next_retry_at',
        'related_booking_id',
        'related_member_id',
        'related_coach_id',
    ];

    protected $casts = [
        'data' => 'array',
        'sent_at' => 'datetime',
        'last_retry_at' => 'datetime',
        'next_retry_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function relatedBooking()
    {
        return $this->belongsTo(Booking::class, 'related_booking_id');
    }

    public function relatedMember()
    {
        return $this->belongsTo(Member::class, 'related_member_id');
    }

    public function relatedCoach()
    {
        return $this->belongsTo(Coach::class, 'related_coach_id');
    }

    public function markAsSent()
    {
        $this->status = 'sent';
        $this->sent_at = now();
        $this->save();
    }

    public function markAsFailed($errorMessage)
    {
        $this->error_message = $errorMessage;
        $this->retry_count++;

        if ($this->retry_count >= $this->max_retries) {
            $this->status = 'failed';
            $this->next_retry_at = null;
        } else {
            $this->status = 'pending_retry';
            $delayMinutes = pow(2, $this->retry_count) * 5;
            $this->next_retry_at = now()->addMinutes($delayMinutes);
            $this->last_retry_at = now();
        }

        $this->save();
    }

    public function canRetry()
    {
        return $this->retry_count < $this->max_retries &&
            ($this->status === 'pending_retry' || $this->status === 'failed');
    }

    public function scopePendingRetry($query)
    {
        return $query->where('status', 'pending_retry')
            ->where(function ($q) {
                $q->whereNull('next_retry_at')
                    ->orWhere('next_retry_at', '<=', now());
            });
    }
}
