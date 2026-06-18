<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnvironmentAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'greenhouse_id',
        'sensor_id',
        'alert_type',
        'severity',
        'threshold_value',
        'actual_value',
        'message',
        'status',
        'acknowledged_by',
        'resolved_by',
        'acknowledged_at',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'severity' => 'string',
            'status' => 'string',
            'acknowledged_at' => 'datetime',
            'resolved_at' => 'datetime',
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

    public function acknowledgedBy()
    {
        return $this->belongsTo(User::class, 'acknowledged_by');
    }

    public function resolvedBy()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
