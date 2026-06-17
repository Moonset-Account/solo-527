<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Notification extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_PENDING = 'pending';
    const STATUS_SENT = 'sent';
    const STATUS_FAILED = 'failed';
    const STATUS_RETRYING = 'retrying';

    const TYPE_EMAIL = 'email';
    const TYPE_SMS = 'sms';
    const TYPE_SYSTEM = 'system';
    const TYPE_WECHAT = 'wechat';
    const TYPE_APP = 'app';

    const CHANNEL_SMTP = 'smtp';
    const CHANNEL_ALIYUN = 'aliyun';
    const CHANNEL_TENCENT = 'tencent';
    const CHANNEL_WECHAT = 'wechat';
    const CHANNEL_INTERNAL = 'internal';

    protected $fillable = [
        'type',
        'content',
        'status',
        'failure_reason',
        'retry_count',
        'recipient',
        'channel',
        'sent_at',
        'metadata',
    ];

    protected $casts = [
        'retry_count' => 'integer',
        'sent_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeSent($query)
    {
        return $query->where('status', self::STATUS_SENT);
    }

    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    public function scopeRetrying($query)
    {
        return $query->where('status', self::STATUS_RETRYING);
    }

    public function scopeType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeEmail($query)
    {
        return $query->where('type', self::TYPE_EMAIL);
    }

    public function scopeSms($query)
    {
        return $query->where('type', self::TYPE_SMS);
    }

    public function scopeRecipient($query, $recipient)
    {
        return $query->where('recipient', $recipient);
    }

    public function scopeChannel($query, $channel)
    {
        return $query->where('channel', $channel);
    }

    public function scopeNeedsRetry($query, $maxRetries = 3)
    {
        return $query->where('status', self::STATUS_FAILED)
            ->where('retry_count', '<', $maxRetries);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    public function scopeRecent($query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    protected function formattedSentAt(): Attribute
    {
        return Attribute::make(
            get: fn () => optional($this->sent_at)->format('Y-m-d H:i'),
        );
    }

    protected function isPending(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status === self::STATUS_PENDING,
        );
    }

    protected function isSent(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status === self::STATUS_SENT,
        );
    }

    protected function isFailed(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status === self::STATUS_FAILED,
        );
    }

    protected function canRetry(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status === self::STATUS_FAILED && $this->retry_count < 3,
        );
    }

    protected function statusLabel(): Attribute
    {
        return Attribute::make(
            get: function () {
                $labels = [
                    self::STATUS_PENDING => '待发送',
                    self::STATUS_SENT => '已发送',
                    self::STATUS_FAILED => '发送失败',
                    self::STATUS_RETRYING => '重试中',
                ];
                return $labels[$this->status] ?? $this->status;
            },
        );
    }

    protected function typeLabel(): Attribute
    {
        return Attribute::make(
            get: function () {
                $labels = [
                    self::TYPE_EMAIL => '邮件',
                    self::TYPE_SMS => '短信',
                    self::TYPE_SYSTEM => '系统通知',
                    self::TYPE_WECHAT => '微信',
                    self::TYPE_APP => 'APP推送',
                ];
                return $labels[$this->type] ?? $this->type;
            },
        );
    }

    protected function channelLabel(): Attribute
    {
        return Attribute::make(
            get: function () {
                $labels = [
                    self::CHANNEL_SMTP => 'SMTP',
                    self::CHANNEL_ALIYUN => '阿里云',
                    self::CHANNEL_TENCENT => '腾讯云',
                    self::CHANNEL_WECHAT => '微信',
                    self::CHANNEL_INTERNAL => '内部通道',
                ];
                return $labels[$this->channel] ?? $this->channel;
            },
        );
    }
}
