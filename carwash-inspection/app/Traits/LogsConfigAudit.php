<?php

namespace App\Traits;

use App\Models\ConfigAuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait LogsConfigAudit
{
    protected function logConfigCreate(string $configType, int $configId, array $newValues): void
    {
        ConfigAuditLog::create([
            'config_type' => $configType,
            'config_id' => $configId,
            'action' => 'create',
            'old_values' => null,
            'new_values' => $newValues,
            'changed_by' => Auth::id(),
            'changed_by_name' => Auth::user()->name,
            'ip_address' => Request::ip(),
            'created_at' => now(),
        ]);
    }

    protected function logConfigUpdate(string $configType, int $configId, array $oldValues, array $newValues): void
    {
        ConfigAuditLog::create([
            'config_type' => $configType,
            'config_id' => $configId,
            'action' => 'update',
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'changed_by' => Auth::id(),
            'changed_by_name' => Auth::user()->name,
            'ip_address' => Request::ip(),
            'created_at' => now(),
        ]);
    }

    protected function logConfigDelete(string $configType, int $configId, array $oldValues): void
    {
        ConfigAuditLog::create([
            'config_type' => $configType,
            'config_id' => $configId,
            'action' => 'delete',
            'old_values' => $oldValues,
            'new_values' => null,
            'changed_by' => Auth::id(),
            'changed_by_name' => Auth::user()->name,
            'ip_address' => Request::ip(),
            'created_at' => now(),
        ]);
    }
}
