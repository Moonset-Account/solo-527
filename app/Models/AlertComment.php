<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'alert_id',
    'user_id',
    'content',
    'type',
])]
class AlertComment extends Model
{
    protected function casts(): array
    {
        return [];
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

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function isStatusChange(): bool
    {
        return $this->type === 'status_change';
    }

    public function isEscalation(): bool
    {
        return $this->type === 'escalation';
    }

    public function isResolution(): bool
    {
        return $this->type === 'resolution';
    }

    public function isComment(): bool
    {
        return $this->type === 'comment';
    }

    public function getTypeBadgeClass(): string
    {
        return match ($this->type) {
            'comment' => 'bg-blue-100 text-blue-800',
            'status_change' => 'bg-yellow-100 text-yellow-800',
            'escalation' => 'bg-red-100 text-red-800',
            'resolution' => 'bg-green-100 text-green-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    public static function addComment(Alert $alert, User $user, string $content, string $type = 'comment'): self
    {
        $comment = new self([
            'alert_id' => $alert->id,
            'user_id' => $user->id,
            'content' => $content,
            'type' => $type,
        ]);

        $comment->save();

        OperationLog::create([
            'user_id' => $user->id,
            'action' => 'alert_comment_added',
            'model_type' => Alert::class,
            'model_id' => $alert->id,
            'description' => "用户 {$user->name} 对告警 #{$alert->id} 添加了评论",
            'new_values' => ['comment' => $content, 'type' => $type],
        ]);

        return $comment;
    }
}
