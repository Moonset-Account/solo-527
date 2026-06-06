<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kiln extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'capacity',
        'width',
        'height',
        'depth',
        'temp_max',
        'temperature_zones',
        'type',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'temperature_zones' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function maintenanceDays()
    {
        return $this->hasMany(KilnMaintenanceDay::class);
    }

    public function kilnBatches()
    {
        return $this->hasMany(KilnBatch::class);
    }

    public function isAvailableOn(Carbon $date): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $dayOfWeek = $date->dayOfWeek;

        $hasMaintenance = $this->maintenanceDays()
            ->where(function ($query) use ($date, $dayOfWeek) {
                $query->where('maintenance_date', $date->toDateString())
                      ->orWhere(function ($q) use ($dayOfWeek) {
                          $q->where('is_recurring_weekly', true)
                            ->where('day_of_week', $dayOfWeek);
                      });
            })
            ->exists();

        return !$hasMaintenance;
    }

    public function getTotalVolume(): float
    {
        return $this->width * $this->height * $this->depth;
    }

    public function getZoneCount(): int
    {
        return count($this->temperature_zones ?? []);
    }

    public function getZoneTemperature(int $zoneIndex): ?int
    {
        return $this->temperature_zones[$zoneIndex] ?? null;
    }
}
