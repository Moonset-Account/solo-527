<?php

namespace Database\Seeders;

use App\Enums\ConfigKey;
use App\Models\SystemConfig;
use Illuminate\Database\Seeder;

class SystemConfigSeeder extends Seeder
{
    public function run(): void
    {
        $configKeys = ConfigKey::cases();

        foreach ($configKeys as $configKey) {
            $type = $configKey->type();
            $defaultValue = $configKey->defaultValue();

            if (is_bool($defaultValue)) {
                $value = $defaultValue ? 'true' : 'false';
            } elseif (is_array($defaultValue)) {
                $value = json_encode($defaultValue);
            } elseif ($defaultValue === null) {
                $value = null;
            } else {
                $value = (string) $defaultValue;
            }

            SystemConfig::firstOrCreate(
                ['key' => $configKey->value],
                [
                    'name' => $configKey->label(),
                    'value' => $value,
                    'type' => $type,
                    'category' => $configKey->category(),
                    'description' => $configKey->label(),
                    'is_switch' => $type === 'boolean',
                    'is_public' => true,
                    'sort' => 0,
                    'is_active' => true,
                ]
            );
        }
    }
}
