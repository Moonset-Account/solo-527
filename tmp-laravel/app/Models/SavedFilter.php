<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SavedFilter extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'page',
        'filter_criteria',
        'is_public',
        'user_id',
        'sort_order',
    ];

    protected $casts = [
        'filter_criteria' => 'array',
        'is_public' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForPage($query, string $page)
    {
        return $query->where('page', $page);
    }

    public function scopeAccessibleBy($query, User $user)
    {
        return $query->where(function ($q) use ($user) {
            $q->where('user_id', $user->id)
                ->orWhere('is_public', true);
        });
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')
            ->orderBy('name');
    }
}
