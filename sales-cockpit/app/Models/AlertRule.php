<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlertRule extends Model
{
    protected $fillable = [
        'business_order_id',
        'indicator_id',
        'condition_type',
        'threshold_value',
        'threshold_value_max',
        'notify_user_ids',
        'is_active',
    ];

    protected $casts = [
        'condition_type' => 'string',
        'threshold_value' => 'decimal:4',
        'threshold_value_max' => 'decimal:4',
        'notify_user_ids' => 'array',
        'is_active' => 'boolean',
    ];

    public function businessOrder(): BelongsTo
    {
        return $this->belongsTo(BusinessOrder::class);
    }

    public function indicator(): BelongsTo
    {
        return $this->belongsTo(Indicator::class);
    }
}
