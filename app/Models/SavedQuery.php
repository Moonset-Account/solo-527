<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'name',
    'model_type',
    'query_params',
    'description',
    'is_public',
    'is_favorite',
    'sort_order',
])]
class SavedQuery extends Model
{
    protected function casts(): array
    {
        return [
            'query_params' => 'array',
            'is_public' => 'boolean',
            'is_favorite' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeByModel($query, $modelType)
    {
        return $query->where('model_type', $modelType);
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeFavorite($query)
    {
        return $query->where('is_favorite', true);
    }

    public function scopeAccessible($query, User $user)
    {
        return $query->where(function ($q) use ($user) {
            $q->where('user_id', $user->id)
                ->orWhere('is_public', true);
        });
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order', 'asc')->orderBy('name', 'asc');
    }

    public function toggleFavorite(): void
    {
        $this->update(['is_favorite' => ! $this->is_favorite]);
    }

    public function isOwnedBy(User $user): bool
    {
        return $this->user_id === $user->id;
    }

    public function getQueryParam($key, $default = null)
    {
        return $this->query_params[$key] ?? $default;
    }
}
