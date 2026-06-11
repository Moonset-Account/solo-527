<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkOrder extends Model
{
    protected $attributes = [
        'payment_status' => 'unpaid',
    ];

    protected $fillable = [
        'order_no',
        'vehicle_id',
        'technician_id',
        'station_id',
        'service_item_id',
        'inspection_template_id',
        'status',
        'scheduled_time',
        'started_at',
        'completed_at',
        'total_amount',
        'paid_amount',
        'payment_method',
        'payment_status',
        'payment_paid_at',
        'notes',
    ];

    protected $casts = [
        'scheduled_time' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'payment_paid_at' => 'datetime',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function technician()
    {
        return $this->belongsTo(Technician::class);
    }

    public function station()
    {
        return $this->belongsTo(WorkStation::class, 'station_id');
    }

    public function serviceItem()
    {
        return $this->belongsTo(ServiceItem::class);
    }

    public function inspectionTemplate()
    {
        return $this->belongsTo(InspectionTemplate::class);
    }

    public function statusTimeline()
    {
        return $this->hasMany(StatusTimeline::class);
    }

    public function inspections()
    {
        return $this->hasMany(WorkOrderInspection::class);
    }

    public function noShowRecords()
    {
        return $this->hasMany(NoShowRecord::class);
    }

    public function qualityReport()
    {
        return $this->hasOne(QualityReport::class);
    }

    public function cashierOrder()
    {
        return $this->hasOne(CashierOrder::class);
    }
}
