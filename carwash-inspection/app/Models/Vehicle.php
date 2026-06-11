<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    protected $fillable = [
        'plate_number',
        'make',
        'model',
        'year',
        'color',
        'owner_name',
        'owner_phone',
        'owner_id_number',
        'notes',
    ];

    protected $casts = [
        'year' => 'integer',
    ];

    public function workOrders()
    {
        return $this->hasMany(WorkOrder::class);
    }

    public function cashierOrders()
    {
        return $this->hasMany(CashierOrder::class);
    }

    public function qualityReports()
    {
        return $this->hasMany(QualityReport::class);
    }
}
