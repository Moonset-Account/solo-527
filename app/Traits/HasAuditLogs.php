<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

trait HasAuditLogs
{
    public static function bootHasAuditLogs(): void
    {
        static::created(function ($model) {
            static::logAudit($model, 'created', null, $model->getAttributes());
        });

        static::updated(function ($model) {
            $old = $model->getOriginal();
            $new = $model->getAttributes();
            $changed = array_diff_assoc($new, $old);

            if (!empty($changed)) {
                static::logAudit($model, 'updated', $old, $changed);
            }
        });

        static::deleted(function ($model) {
            static::logAudit($model, 'deleted', $model->getAttributes(), null);
        });
    }

    protected static function logAudit($model, string $action, ?array $oldValues, ?array $newValues): void
    {
        $hidden = $model->getHidden();
        $old = $oldValues ? array_diff_key($oldValues, array_flip($hidden)) : null;
        $new = $newValues ? array_diff_key($newValues, array_flip($hidden)) : null;

        AuditLog::create([
            'auditable_type' => get_class($model),
            'auditable_id' => $model->getKey(),
            'user_id' => Auth::check() ? Auth::id() : null,
            'action' => $action,
            'old_values' => $old,
            'new_values' => $new,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    public function auditLogs()
    {
        return $this->morphMany(AuditLog::class, 'auditable');
    }
}
