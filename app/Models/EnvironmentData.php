<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnvironmentData extends Model
{
    use HasFactory;

    protected $fillable = [
        'greenhouse_id',
        'sensor_id',
        'temperature',
        'humidity',
        'soil_moisture',
        'light_intensity',
        'co2_level',
        'ph_value',
        'is_anomaly',
        'anomaly_type',
        'recorded_at',
    ];

    protected function casts(): array
    {
        return [
            'is_anomaly' => 'boolean',
            'recorded_at' => 'datetime',
        ];
    }

    public function greenhouse()
    {
        return $this->belongsTo(Greenhouse::class);
    }

    public function sensor()
    {
        return $this->belongsTo(EnvironmentSensor::class, 'sensor_id');
    }
}
