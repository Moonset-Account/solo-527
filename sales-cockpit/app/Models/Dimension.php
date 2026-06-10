<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dimension extends Model
{
    protected $fillable = [
        'business_order_id',
        'name',
        'code',
        'values_json',
        'is_active',
    ];

    protected $casts = [
        'values_json' => 'array',
        'is_active' => 'boolean',
    ];

    public function businessOrder(): BelongsTo
    {
        return $this->belongsTo(BusinessOrder::class);
    }
}
