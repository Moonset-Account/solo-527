<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id', 'config_group', 'config_key', 'config_value',
        'value_type', 'title', 'description', 'is_public', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function getParsedValueAttribute()
    {
        return match ($this->value_type) {
            'boolean' => (bool) $this->config_value,
            'number' => (float) $this->config_value,
            'integer' => (int) $this->config_value,
            'json', 'array' => json_decode($this->config_value, true) ?? [],
            default => $this->config_value,
        };
    }

    public function scopeByGroup($query, string $group, ?int $eventId = null)
    {
        $query->where('config_group', $group);
        if ($eventId !== null) {
            $query->where(function ($q) use ($eventId) {
                $q->where('event_id', $eventId)->orWhereNull('event_id');
            });
        }
        return $query;
    }

    public static function getValue(string $group, string $key, $default = null, ?int $eventId = null)
    {
        $config = static::byGroup($group, $eventId)
            ->where('config_key', $key)
            ->when($eventId !== null, fn($q) => $q->orderByRaw('event_id IS NULL ASC'))
            ->first();

        return $config ? $config->parsed_value : $default;
    }

    public static function setValue(string $group, string $key, $value, string $title = '', string $type = 'string', ?int $eventId = null, ?int $userId = null): self
    {
        $encodedValue = match ($type) {
            'boolean' => $value ? '1' : '0',
            'json', 'array' => json_encode($value, JSON_UNESCAPED_UNICODE),
            default => (string) $value,
        };

        return static::updateOrCreate(
            [
                'config_group' => $group,
                'config_key' => $key,
                'event_id' => $eventId,
            ],
            [
                'config_value' => $encodedValue,
                'value_type' => $type,
                'title' => $title ?: $key,
                'updated_by' => $userId,
            ]
        );
    }
}
