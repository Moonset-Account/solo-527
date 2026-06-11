<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkOrderInspection extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'work_order_id',
        'inspection_template_id',
        'item_name',
        'category',
        'result',
        'remarks',
        'inspected_by',
        'inspected_at',
    ];

    protected $casts = [
        'inspected_at' => 'datetime',
    ];

    public function workOrder()
    {
        return $this->belongsTo(WorkOrder::class);
    }

    public function inspectionTemplate()
    {
        return $this->belongsTo(InspectionTemplate::class);
    }

    public function inspector()
    {
        return $this->belongsTo(User::class, 'inspected_by');
    }
}
