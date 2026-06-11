<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StatusTimeline extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'work_order_id',
        'from_status',
        'to_status',
        'handler_id',
        'handler_name',
        'remarks',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function workOrder()
    {
        return $this->belongsTo(WorkOrder::class);
    }

    public function handler()
    {
        return $this->belongsTo(User::class, 'handler_id');
    }
}
