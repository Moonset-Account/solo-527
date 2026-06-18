<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Greenhouse extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'location',
        'area',
        'crop_type',
        'status',
        'manager_id',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'string',
        ];
    }

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function environmentSensors()
    {
        return $this->hasMany(EnvironmentSensor::class);
    }

    public function environmentData()
    {
        return $this->hasMany(EnvironmentData::class);
    }

    public function environmentAlerts()
    {
        return $this->hasMany(EnvironmentAlert::class);
    }

    public function subsidyVouchers()
    {
        return $this->hasMany(SubsidyVoucher::class);
    }

    public function machineryAppointments()
    {
        return $this->hasMany(MachineryAppointment::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function sortingTasks()
    {
        return $this->hasMany(SortingTask::class);
    }

    public function shipments()
    {
        return $this->hasMany(Shipment::class);
    }
}
