<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'log_name', 'description', 'subject_type', 'subject_id',
        'causer_type', 'causer_id', 'properties', 'old_values',
        'new_values', 'batch_uuid', 'event', 'causer_impersonator_id',
        'method', 'url', 'ip', 'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'properties' => 'array',
            'old_values' => 'array',
            'new_values' => 'array',
        ];
    }

    public function subject()
    {
        return $this->morphTo();
    }

    public function causer()
    {
        return $this->morphTo();
    }

    public function scopeForSubject($query, Model $subject)
    {
        return $query->where([
            'subject_type' => $subject->getMorphClass(),
            'subject_id' => $subject->getKey(),
        ]);
    }

    public function scopeByCauser($query, Model $causer)
    {
        return $query->where([
            'causer_type' => $causer->getMorphClass(),
            'causer_id' => $causer->getKey(),
        ]);
    }

    public function scopeInLog($query, string ...$logs)
    {
        if (count($logs) === 1) {
            return $query->where('log_name', $logs[0]);
        }
        return $query->whereIn('log_name', $logs);
    }

    public function hasLoggedChanges(): bool
    {
        return !empty($this->old_values) || !empty($this->new_values);
    }

    public function getChanges(): array
    {
        $changes = [];
        $attributes = array_keys(array_merge($this->old_values ?? [], $this->new_values ?? []));
        foreach ($attributes as $attribute) {
            $changes[$attribute] = [
                'old' => $this->old_values[$attribute] ?? null,
                'new' => $this->new_values[$attribute] ?? null,
            ];
        }
        return $changes;
    }
}
