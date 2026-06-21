<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

trait LogsActivity
{
    protected static function bootLogsActivity(): void
    {
        $events = ['created', 'updated', 'deleted'];

        foreach ($events as $event) {
            static::$event(function (Model $model) use ($event) {
                $model->logActivity($event);
            });
        }
    }

    protected function logActivity(string $event): void
    {
        $oldValues = [];
        $newValues = [];

        if ($event === 'updated') {
            $dirty = $this->getDirty();
            $oldValues = collect($dirty)->mapWithKeys(fn ($value, $key) => [
                $key => $this->getOriginal($key)
            ])->all();
            $newValues = $dirty;
        } elseif ($event === 'created') {
            $newValues = $this->toArray();
        }

        $description = match ($event) {
            'created' => '创建了 ' . class_basename($this) . " #{$this->getKey()}",
            'updated' => '更新了 ' . class_basename($this) . " #{$this->getKey()}: " . implode(', ', array_keys($newValues)),
            'deleted' => '删除了 ' . class_basename($this) . " #{$this->getKey()}",
            default => $event . ' ' . class_basename($this) . " #{$this->getKey()}",
        };

        $logName = $this->getLogName() ?? class_basename($this);
        $causer = Auth::user();

        ActivityLog::create([
            'log_name' => $logName,
            'description' => $description,
            'subject_type' => $this->getMorphClass(),
            'subject_id' => $this->getKey(),
            'causer_type' => $causer ? $causer->getMorphClass() : null,
            'causer_id' => $causer?->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'event' => $event,
            'batch_uuid' => (string) Str::uuid(),
            'method' => request()->method(),
            'url' => request()->fullUrl(),
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    protected function getLogName(): ?string
    {
        return $this->logName ?? null;
    }

    public function activityLogs()
    {
        return $this->morphMany(ActivityLog::class, 'subject');
    }
}
