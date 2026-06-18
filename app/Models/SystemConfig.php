<?php

namespace App\Models;

use App\Enums\ConfigKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'name',
        'value',
        'type',
        'category',
        'description',
        'is_switch',
        'is_public',
        'sort',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'key' => ConfigKey::class,
            'is_switch' => 'boolean',
            'is_public' => 'boolean',
            'sort' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function scopeByKey($query, ConfigKey $key)
    {
        return $query->where('key', $key->value);
    }

    public function getTypedValue(): mixed
    {
        $type = $this->type ?? 'string';

        return match ($type) {
            'integer' => (int) $this->value,
            'decimal', 'float' => (float) $this->value,
            'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            'json', 'array' => json_decode($this->value, true),
            default => $this->value,
        };
    }

    public static function getValue(ConfigKey $key): mixed
    {
        $config = self::byKey($key)->first();

        if ($config) {
            return $config->getTypedValue();
        }

        return $key->defaultValue();
    }

    public static function setValue(ConfigKey $key, mixed $value, ?int $userId = null): self
    {
        $config = self::byKey($key)->first();

        if ($config) {
            $config->update([
                'value' => is_array($value) ? json_encode($value) : (string) $value,
                'updated_by' => $userId,
            ]);
        } else {
            $config = self::create([
                'key' => $key,
                'value' => is_array($value) ? json_encode($value) : (string) $value,
                'type' => $key->type(),
                'description' => $key->label(),
                'updated_by' => $userId,
            ]);
        }

        return $config;
    }
}
