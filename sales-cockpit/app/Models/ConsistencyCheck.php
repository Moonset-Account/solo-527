<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsistencyCheck extends Model
{
    protected $fillable = [
        'indicator_id',
        'check_type',
        'expected_value',
        'actual_value',
        'discrepancy',
        'status',
        'checked_by',
        'checked_at',
        'details',
    ];

    protected $casts = [
        'expected_value' => 'decimal:4',
        'actual_value' => 'decimal:4',
        'discrepancy' => 'decimal:4',
        'status' => 'string',
        'checked_at' => 'datetime',
        'details' => 'array',
    ];

    public function indicator(): BelongsTo
    {
        return $this->belongsTo(Indicator::class);
    }

    public function checker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_by');
    }
}
