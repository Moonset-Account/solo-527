<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shipment extends Model
{
    use HasFactory;

    protected $fillable = [
        'shipment_no',
        'order_id',
        'sorting_task_id',
        'greenhouse_id',
        'logistics_company',
        'tracking_no',
        'shipment_date',
        'estimated_arrival',
        'actual_arrival',
        'receiver_name',
        'receiver_phone',
        'receiver_address',
        'status',
        'weight',
        'packages',
        'remark',
        'shipped_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'string',
            'shipment_date' => 'date',
            'estimated_arrival' => 'date',
            'actual_arrival' => 'date',
        ];
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function sortingTask()
    {
        return $this->belongsTo(SortingTask::class);
    }

    public function greenhouse()
    {
        return $this->belongsTo(Greenhouse::class);
    }

    public function shippedBy()
    {
        return $this->belongsTo(User::class, 'shipped_by');
    }

    public function attachments()
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }

    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    public function auditLogs()
    {
        return $this->morphMany(AuditLog::class, 'auditable');
    }
}
