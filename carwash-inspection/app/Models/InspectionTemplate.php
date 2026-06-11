<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InspectionTemplate extends Model
{
    protected $fillable = [
        'name',
        'category',
        'items',
        'is_active',
        'version',
    ];

    protected $casts = [
        'items' => 'array',
        'is_active' => 'boolean',
        'version' => 'integer',
    ];

    public function workOrders()
    {
        return $this->hasMany(WorkOrder::class);
    }

    public function workOrderInspections()
    {
        return $this->hasMany(WorkOrderInspection::class);
    }
}
