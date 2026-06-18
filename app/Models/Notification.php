<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

#[Fillable([
    'user_id',
    'title',
    'content',
    'type',
    'level',
    'notifiable_type',
    'notifiable_id',
    'read_at',
    'sent_at',
    'channels',
    'metadata',
])]
class Notification extends Model
{
    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'sent_at' => 'datetime',
            'channels' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function notifiable(): MorphTo
    {
        return $this->morphTo();
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function scopeRead($query)
    {
        return $query->whereNotNull('read_at');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByLevel($query, $level)
    {
        return $query->where('level', $level);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByDateRange($query, $start, $end)
    {
        return $query->whereBetween('created_at', [$start, $end]);
    }

    public function isUnread(): bool
    {
        return is_null($this->read_at);
    }

    public function isRead(): bool
    {
        return ! is_null($this->read_at);
    }

    public function markAsRead(): void
    {
        if ($this->isUnread()) {
            $this->update(['read_at' => now()]);
        }
    }

    public function markAsUnread(): void
    {
        if ($this->isRead()) {
            $this->update(['read_at' => null]);
        }
    }

    public function getTypeBadgeClass(): string
    {
        return match ($this->type) {
            'alert' => 'bg-red-100 text-red-800',
            'escalation' => 'bg-orange-100 text-orange-800',
            'duty' => 'bg-blue-100 text-blue-800',
            'system' => 'bg-gray-100 text-gray-800',
            'approval' => 'bg-yellow-100 text-yellow-800',
            'inspection' => 'bg-purple-100 text-purple-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    public function getLevelBadgeClass(): string
    {
        return match ($this->level) {
            'critical' => 'bg-red-100 text-red-800',
            'warning' => 'bg-yellow-100 text-yellow-800',
            'info' => 'bg-blue-100 text-blue-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    public function getChannelsArray(): array
    {
        return $this->channels ?? ['site'];
    }

    public static function sendToUser(User $user, string $title, string $content, string $type = 'system', string $level = 'info', ?Model $notifiable = null, array $channels = ['site']): self
    {
        $notification = new self([
            'user_id' => $user->id,
            'title' => $title,
            'content' => $content,
            'type' => $type,
            'level' => $level,
            'sent_at' => now(),
            'channels' => $channels,
        ]);

        if ($notifiable) {
            $notification->notifiable_type = get_class($notifiable);
            $notification->notifiable_id = $notifiable->id;
        }

        $notification->save();

        return $notification;
    }

    public static function sendToUsers($users, string $title, string $content, string $type = 'system', string $level = 'info', ?Model $notifiable = null, array $channels = ['site']): void
    {
        foreach ($users as $user) {
            self::sendToUser($user, $title, $content, $type, $level, $notifiable, $channels);
        }
    }

    public static function markAllAsReadForUser(User $user): void
    {
        self::where('user_id', $user->id)->unread()->update(['read_at' => now()]);
    }
}
