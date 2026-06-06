<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Notification extends Model
{
    use HasFactory;

    const STATUS_PENDING = 'pending';
    const STATUS_SENT = 'sent';
    const STATUS_FAILED = 'failed';
    const STATUS_READ = 'read';

    protected $fillable = [
        'type',
        'notifiable_id',
        'notifiable_type',
        'data',
        'retry_count',
        'max_retries',
        'last_retry_at',
        'error_message',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'read_at' => 'datetime',
            'last_retry_at' => 'datetime',
        ];
    }

    public function notifiable()
    {
        return $this->morphTo();
    }

    public function canRetry()
    {
        return $this->status === self::STATUS_FAILED &&
               $this->retry_count < $this->max_retries;
    }

    public function markAsRead()
    {
        $this->update([
            'read_at' => now(),
            'status' => self::STATUS_READ,
        ]);
    }
}
