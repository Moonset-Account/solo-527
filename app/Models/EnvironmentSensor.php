<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnvironmentSensor extends Model
{
    use HasFactory;

    protected $fillable = [
        'greenhouse_id',
        'code',
        'type',
        'unit',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'string',
        ];
    }

    public function greenhouse()
    {
        return $this->belongsTo(Greenhouse::class);
    }

    public function environmentData()
    {
        return $this->hasMany(EnvironmentData::class, 'sensor_id');
    }

    public function environmentAlerts()
    {
        return $this->hasMany(EnvironmentAlert::class, 'sensor_id');
    }
}
