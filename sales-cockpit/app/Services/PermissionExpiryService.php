<?php

namespace App\Services;

use App\Models\DatasetPermission;
use App\Notifications\PermissionExpiringNotification;
use Illuminate\Support\Facades\Redis;

class PermissionExpiryService
{
    public function checkExpiring(int $daysBeforeExpiry = 7)
    {
        return DatasetPermission::where('is_active', true)
            ->whereBetween('expires_at', [
                now(),
                now()->addDays($daysBeforeExpiry),
            ])
            ->with(['user', 'businessOrder'])
            ->get();
    }

    public function notifyExpiring(): void
    {
        $expiring = $this->checkExpiring();

        foreach ($expiring as $permission) {
            $cacheKey = "perm_expiry_notify:{$permission->id}";

            if (Redis::exists($cacheKey)) {
                continue;
            }

            if ($permission->user) {
                $permission->user->notify(new PermissionExpiringNotification($permission));
            }

            Redis::setex($cacheKey, 86400, (string) $permission->id);
        }
    }

    public function deactivateExpired(): void
    {
        $expired = DatasetPermission::where('is_active', true)
            ->where('expires_at', '<', now())
            ->get();

        $auditService = app(AuditService::class);

        foreach ($expired as $permission) {
            $oldValues = $permission->toArray();
            $permission->update(['is_active' => false]);
            $auditService->log(
                'deactivate',
                'dataset_permission',
                $permission->id,
                $oldValues,
                ['is_active' => false],
            );
        }
    }
}
