<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'name',
    'description',
    'level',
    'wait_minutes',
    'escalation_level',
    'notification_channels',
    'notify_roles',
    'notify_user_ids',
    'is_enabled',
    'created_by',
])]
class EscalationRule extends Model
{
    protected function casts(): array
    {
        return [
            'wait_minutes' => 'integer',
            'escalation_level' => 'integer',
            'is_enabled' => 'boolean',
            'notification_channels' => 'array',
            'notify_roles' => 'array',
            'notify_user_ids' => 'array',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }

    public function scopeByAlertLevel($query, $level)
    {
        return $query->where('level', $level);
    }

    public function scopeByLevel($query, $level)
    {
        return $query->where('escalation_level', $level);
    }

    public function getChannelsArray(): array
    {
        return $this->notification_channels ?? ['email', 'sms', 'site'];
    }

    public function shouldNotify(Alert $alert): bool
    {
        if (! $this->is_enabled) {
            return false;
        }

        if ($alert->level !== $this->level) {
            return false;
        }

        $elapsedMinutes = now()->diffInMinutes($alert->created_at);

        return $elapsedMinutes >= $this->wait_minutes && $alert->escalation_level < $this->escalation_level;
    }

    public function getNotifyUsers()
    {
        $users = collect();

        if (! empty($this->notify_roles)) {
            $roleUsers = User::whereIn('role', $this->notify_roles)->get();
            $users = $users->merge($roleUsers);
        }

        if (! empty($this->notify_user_ids)) {
            $idUsers = User::whereIn('id', $this->notify_user_ids)->get();
            $users = $users->merge($idUsers);
        }

        return $users->unique('id');
    }
}
