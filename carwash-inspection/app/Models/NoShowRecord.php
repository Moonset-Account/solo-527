<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NoShowRecord extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'work_order_id',
        'handled_by',
        'handler_name',
        'reason',
        'contact_attempts',
        'rescheduled',
        'rescheduled_order_id',
        'created_at',
    ];

    protected $casts = [
        'contact_attempts' => 'integer',
        'rescheduled' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function workOrder()
    {
        return $this->belongsTo(WorkOrder::class);
    }

    public function handler()
    {
        return $this->belongsTo(User::class, 'handled_by');
    }

    public function rescheduledOrder()
    {
        return $this->belongsTo(WorkOrder::class, 'rescheduled_order_id');
    }
}
