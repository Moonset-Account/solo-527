<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Indicator extends Model
{
    protected $fillable = [
        'name',
        'code',
        'caliber_description',
        'unit',
        'category',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'status' => 'string',
    ];

    public function indicatorValues(): HasMany
    {
        return $this->hasMany(IndicatorValue::class);
    }

    public function consistencyChecks(): HasMany
    {
        return $this->hasMany(ConsistencyCheck::class);
    }

    public function reviewRhythms(): HasMany
    {
        return $this->hasMany(ReviewRhythm::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
