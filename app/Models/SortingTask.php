<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SortingTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_no',
        'order_id',
        'greenhouse_id',
        'assigned_to',
        'planned_quantity',
        'actual_quantity',
        'planned_sort_date',
        'actual_start_time',
        'actual_end_time',
        'status',
        'quality_level',
        'remark',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'string',
            'planned_sort_date' => 'date',
            'actual_start_time' => 'datetime',
            'actual_end_time' => 'datetime',
        ];
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function greenhouse()
    {
        return $this->belongsTo(Greenhouse::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function discrepancies()
    {
        return $this->hasMany(SortingDiscrepancy::class, 'sorting_task_id');
    }

    public function shipment()
    {
        return $this->hasOne(Shipment::class);
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
