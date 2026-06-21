<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RegistrationQualityScore extends Model
{
    use HasFactory;

    const QUALITY_LEVELS = [
        'S' => ['label' => 'S级', 'color' => '#9c27b0', 'min' => 85],
        'A' => ['label' => 'A级', 'color' => '#f44336', 'min' => 70],
        'B' => ['label' => 'B级', 'color' => '#ff9800', 'min' => 55],
        'C' => ['label' => 'C级', 'color' => '#2196f3', 'min' => 40],
        'D' => ['label' => 'D级', 'color' => '#9e9e9e', 'min' => 0],
    ];

    protected $fillable = [
        'registration_id', 'event_id', 'information_completeness',
        'position_level_score', 'company_quality_score', 'industry_match_score',
        'history_score', 'total_score', 'quality_level', 'score_remark',
        'is_key_customer', 'is_vip', 'scored_by',
    ];

    protected function casts(): array
    {
        return [
            'is_key_customer' => 'boolean',
            'is_vip' => 'boolean',
        ];
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function scorer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'scored_by');
    }

    public function getLevelConfig(): array
    {
        return static::QUALITY_LEVELS[$this->quality_level] ?? static::QUALITY_LEVELS['D'];
    }

    public function getLevelLabelAttribute(): string
    {
        return $this->getLevelConfig()['label'];
    }

    public function getLevelColorAttribute(): string
    {
        return $this->getLevelConfig()['color'];
    }
}
