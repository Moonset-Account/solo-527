<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ReminderLog extends Model
{
    protected $fillable = [
        'reminder_rule_id',
        'type',
        'notifiable_id',
        'notifiable_type',
        'recipient_id',
        'channel',
        'title',
        'content',
        'read_at',
        'sent_at',
        'status',
    ];

    protected $casts = [
        'read_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_SENT = 'sent';
    const STATUS_FAILED = 'failed';
    const STATUS_READ = 'read';

    public function notifiable(): MorphTo
    {
        return $this->morphTo();
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function reminderRule(): BelongsTo
    {
        return $this->belongsTo(ReminderRule::class);
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function markAsRead(): self
    {
        $this->read_at = now();
        $this->status = self::STATUS_READ;
        $this->save();

        return $this;
    }

    public function isRead(): bool
    {
        return $this->read_at !== null;
    }
}
