<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SortingDiscrepancy extends Model
{
    use HasFactory;

    protected $fillable = [
        'sorting_task_id',
        'order_id',
        'discrepancy_type',
        'planned_qty',
        'actual_qty',
        'difference',
        'unit',
        'remark',
        'handling_result',
        'social_impact',
        'handled_by',
        'handled_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'social_impact' => 'array',
            'status' => 'string',
            'handled_at' => 'datetime',
        ];
    }

    public function sortingTask()
    {
        return $this->belongsTo(SortingTask::class, 'sorting_task_id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function handledBy()
    {
        return $this->belongsTo(User::class, 'handled_by');
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
