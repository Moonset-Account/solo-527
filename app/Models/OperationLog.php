<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

#[Fillable([
    'user_id',
    'action',
    'model_type',
    'model_id',
    'old_values',
    'new_values',
    'description',
    'ip_address',
    'user_agent',
    'request_method',
    'request_url',
])]
class OperationLog extends Model
{
    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function model(): MorphTo
    {
        return $this->morphTo();
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByAction($query, $action)
    {
        return $query->where('action', $action);
    }

    public function scopeByModel($query, $modelType, $modelId = null)
    {
        $query->where('model_type', $modelType);
        if ($modelId) {
            $query->where('model_id', $modelId);
        }

        return $query;
    }

    public function scopeByDateRange($query, $start, $end)
    {
        return $query->whereBetween('created_at', [$start, $end]);
    }

    public function scopeSearch($query, $keyword)
    {
        return $query->where(function ($q) use ($keyword) {
            $q->where('action', 'like', "%{$keyword}%")
                ->orWhere('description', 'like', "%{$keyword}%")
                ->orWhere('ip_address', 'like', "%{$keyword}%")
                ->orWhereHas('user', function ($q2) use ($keyword) {
                    $q2->where('name', 'like', "%{$keyword}%");
                });
        });
    }

    public function scopeInspectionMissed($query)
    {
        return $query->where('action', 'inspection_missed');
    }

    public function getActionBadgeClass(): string
    {
        return match (true) {
            str_contains($this->action, 'create') => 'bg-green-100 text-green-800',
            str_contains($this->action, 'update') || str_contains($this->action, 'edit') => 'bg-blue-100 text-blue-800',
            str_contains($this->action, 'delete') => 'bg-red-100 text-red-800',
            str_contains($this->action, 'alert') => 'bg-yellow-100 text-yellow-800',
            str_contains($this->action, 'missed') => 'bg-red-100 text-red-800',
            str_contains($this->action, 'approve') => 'bg-green-100 text-green-800',
            str_contains($this->action, 'reject') => 'bg-red-100 text-red-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    public function getModelName(): string
    {
        if (! $this->model_type) {
            return 'System';
        }

        return class_basename($this->model_type);
    }

    public function getChanges(): array
    {
        $changes = [];
        $old = $this->old_values ?? [];
        $new = $this->new_values ?? [];

        $allKeys = array_merge(array_keys($old), array_keys($new));

        foreach ($allKeys as $key) {
            $oldValue = $old[$key] ?? null;
            $newValue = $new[$key] ?? null;

            if ($oldValue !== $newValue) {
                $changes[$key] = [
                    'old' => $oldValue,
                    'new' => $newValue,
                ];
            }
        }

        return $changes;
    }

    public function hasChanges(): bool
    {
        return ! empty($this->getChanges());
    }

    public static function log(string $action, string $description, ?Model $model = null, array $oldValues = [], array $newValues = []): self
    {
        $log = new self([
            'user_id' => auth()->id(),
            'action' => $action,
            'description' => $description,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'request_method' => request()->method(),
            'request_url' => request()->fullUrl(),
        ]);

        if ($model) {
            $log->model_type = get_class($model);
            $log->model_id = $model->id;
        }

        $log->save();

        return $log;
    }
}
