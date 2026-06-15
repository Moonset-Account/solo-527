<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ReminderRule extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'type',
        'trigger_condition',
        'trigger_value',
        'time_unit',
        'channel',
        'recipient_roles',
        'recipient_user_ids',
        'template',
        'is_enabled',
        'priority',
        'max_reminders',
        'reminder_interval_hours',
        'created_by',
    ];

    protected $casts = [
        'recipient_roles' => 'array',
        'recipient_user_ids' => 'array',
        'is_enabled' => 'boolean',
    ];

    const TYPE_GAP_DUE = 'gap_due';
    const TYPE_GAP_OVERDUE = 'gap_overdue';
    const TYPE_CHECKLIST_DUE = 'checklist_due';
    const TYPE_REVIEW_PENDING = 'review_pending';

    const TRIGGER_BEFORE_DUE = 'before_due';
    const TRIGGER_AFTER_DUE = 'after_due';
    const TRIGGER_IMMEDIATE = 'immediate';
    const TRIGGER_DAILY = 'daily';

    const CHANNEL_EMAIL = 'email';
    const CHANNEL_IN_APP = 'in_app';
    const CHANNEL_SMS = 'sms';

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reminderLogs(): HasMany
    {
        return $this->hasMany(ReminderLog::class);
    }

    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function shouldTrigger($dueDate, $reminderCount = 0): bool
    {
        if (!$this->is_enabled) {
            return false;
        }

        if ($this->max_reminders > 0 && $reminderCount >= $this->max_reminders) {
            return false;
        }

        $now = now();

        switch ($this->trigger_condition) {
            case self::TRIGGER_BEFORE_DUE:
                $triggerDate = $dueDate->sub($this->trigger_value, $this->time_unit);
                return $now->gte($triggerDate) && $now->lt($dueDate);
            case self::TRIGGER_AFTER_DUE:
                $triggerDate = $dueDate->add($this->trigger_value, $this->time_unit);
                return $now->gte($triggerDate);
            case self::TRIGGER_IMMEDIATE:
                return true;
            case self::TRIGGER_DAILY:
                return true;
            default:
                return false;
        }
    }
}
