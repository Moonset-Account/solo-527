<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkStation extends Model
{
    protected $fillable = [
        'name',
        'station_type',
        'is_active',
        'description',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function workOrders()
    {
        return $this->hasMany(WorkOrder::class);
    }
}
