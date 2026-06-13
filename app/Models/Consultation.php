<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Consultation extends Model
{
    use HasFactory;

    protected $fillable = [
        'lead_id',
        'content',
        'intention',
        'quality',
        'next_follow_at',
        'operator_id',
    ];

    protected $casts = [
        'next_follow_at' => 'datetime',
    ];

    protected static array $qualityLabels = [
        'A' => 'A级 - 高意向',
        'B' => 'B级 - 中意向',
        'C' => 'C级 - 低意向',
        'D' => 'D级 - 无效',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function operator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'operator_id');
    }

    public function getQualityLabelAttribute(): ?string
    {
        return $this->quality ? (static::$qualityLabels[$this->quality] ?? $this->quality) : null;
    }
}
