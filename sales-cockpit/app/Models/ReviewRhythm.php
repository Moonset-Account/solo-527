<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReviewRhythm extends Model
{
    protected $fillable = [
        'indicator_id',
        'rhythm_type',
        'next_review_date',
        'responsible_user_id',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'rhythm_type' => 'string',
        'next_review_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function indicator(): BelongsTo
    {
        return $this->belongsTo(Indicator::class);
    }

    public function responsible(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsible_user_id');
    }
}
