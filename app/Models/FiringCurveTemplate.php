<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FiringCurveTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'max_temperature',
        'atmosphere',
        'total_duration_minutes',
        'created_by',
        'is_public',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function points()
    {
        return $this->hasMany(FiringCurvePoint::class)->orderBy('sort_order');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function kilnBatches()
    {
        return $this->hasMany(KilnBatch::class);
    }

    public function getTemperatureAtTime(int $minutes): int
    {
        $points = $this->points;

        if ($points->isEmpty()) {
            return 0;
        }

        if ($minutes <= $points->first()->time_minutes) {
            return $points->first()->temperature;
        }

        if ($minutes >= $points->last()->time_minutes) {
            return $points->last()->temperature;
        }

        foreach ($points as $i => $point) {
            if ($point->time_minutes > $minutes) {
                $prevPoint = $points[$i - 1];
                $timeDiff = $point->time_minutes - $prevPoint->time_minutes;
                $tempDiff = $point->temperature - $prevPoint->temperature;
                $ratio = ($minutes - $prevPoint->time_minutes) / $timeDiff;

                return (int) round($prevPoint->temperature + ($tempDiff * $ratio));
            }
        }

        return $points->last()->temperature;
    }
}
