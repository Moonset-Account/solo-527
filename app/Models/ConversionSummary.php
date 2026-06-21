<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConversionSummary extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id', 'summary_date', 'new_inquiry_count', 'new_registered_count',
        'new_confirmed_count', 'new_paid_count', 'new_lost_count',
        'total_inquiry_count', 'total_registered_count', 'total_confirmed_count',
        'total_paid_count', 'total_paid_amount', 'total_lost_count',
        'conversion_rate', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'summary_date' => 'date',
            'total_paid_amount' => 'decimal:2',
            'conversion_rate' => 'decimal:4',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
