<?php

namespace App\Services;

use App\Enums\ConfigKey;
use App\Models\SystemConfig;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ConfigService
{
    protected string $cacheKey = 'system_configs';
    protected int $cacheTtl = 3600;

    public function get(ConfigKey|string $key, mixed $default = null): mixed
    {
        $configs = $this->getAllConfigs();
        $keyValue = $key instanceof ConfigKey ? $key->value : $key;

        if (isset($configs[$keyValue])) {
            return $configs[$keyValue];
        }

        if ($key instanceof ConfigKey) {
            return $key->defaultValue();
        }

        return $default;
    }

    public function getBoolean(ConfigKey|string $key, bool $default = false): bool
    {
        $value = $this->get($key, $default);
        if (is_bool($value)) {
            return $value;
        }
        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $default;
    }

    public function getInt(ConfigKey|string $key, int $default = 0): int
    {
        return (int) $this->get($key, $default);
    }

    public function getFloat(ConfigKey|string $key, float $default = 0.0): float
    {
        return (float) $this->get($key, $default);
    }

    public function set(ConfigKey|string $key, mixed $value, ?User $user = null): SystemConfig
    {
        $keyValue = $key instanceof ConfigKey ? $key->value : $key;
        $type = $key instanceof ConfigKey ? $key->type() : gettype($value);

        if (is_bool($value)) {
            $storedValue = $value ? 'true' : 'false';
        } else {
            $storedValue = (string) $value;
        }

        $config = SystemConfig::updateOrCreate(
            ['key' => $keyValue],
            [
                'value' => $storedValue,
                'type' => $type,
                'updated_by' => $user?->id,
            ]
        );

        $this->clearCache();
        return $config;
    }

    public function getAllConfigs(): array
    {
        return Cache::remember($this->cacheKey, $this->cacheTtl, function () {
            $configs = SystemConfig::all();
            $result = [];

            foreach ($configs as $config) {
                $result[$config->key] = $config->getTypedValue();
            }

            foreach (ConfigKey::cases() as $key) {
                if (!isset($result[$key->value])) {
                    $result[$key->value] = $key->defaultValue();
                }
            }

            return $result;
        });
    }

    public function getAllConfigModels(): \Illuminate\Database\Eloquent\Collection
    {
        return SystemConfig::all();
    }

    public function bulkUpdate(array $configs, ?User $user = null): void
    {
        DB::transaction(function () use ($configs, $user) {
            foreach ($configs as $key => $value) {
                $enumKey = ConfigKey::tryFrom($key);
                $this->set($enumKey ?? $key, $value, $user);
            }
        });
    }

    public function resetToDefault(ConfigKey $key, ?User $user = null): SystemConfig
    {
        return $this->set($key, $key->defaultValue(), $user);
    }

    public function resetAllToDefault(?User $user = null): void
    {
        DB::transaction(function () use ($user) {
            foreach (ConfigKey::cases() as $key) {
                $this->set($key, $key->defaultValue(), $user);
            }
        });
    }

    public function clearCache(): void
    {
        Cache::forget($this->cacheKey);
    }

    public function isMaintenanceMode(): bool
    {
        return $this->getBoolean(ConfigKey::SYSTEM_MAINTENANCE_MODE);
    }

    public function setMaintenanceMode(bool $enabled, ?User $user = null): SystemConfig
    {
        return $this->set(ConfigKey::SYSTEM_MAINTENANCE_MODE, $enabled, $user);
    }
}
