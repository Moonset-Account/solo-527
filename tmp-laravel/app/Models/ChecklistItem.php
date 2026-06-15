<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChecklistItem extends Model
{
    protected $fillable = [
        'checklist_id',
        'title',
        'description',
        'criteria',
        'sort_order',
        'risk_level',
        'category',
        'is_required',
    ];

    protected $casts = [
        'is_required' => 'boolean',
    ];

    public function checklist(): BelongsTo
    {
        return $this->belongsTo(Checklist::class);
    }

    public function recordItems(): HasMany
    {
        return $this->hasMany(ChecklistRecordItem::class);
    }
}
