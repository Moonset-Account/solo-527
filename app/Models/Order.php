<?php

namespace App\Models;

use App\Traits\Filterable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;

class Order extends Model
{
    use HasFactory, SoftDeletes, Filterable;

    protected $fillable = [
        'order_no',
        'greenhouse_id',
        'customer_name',
        'customer_phone',
        'customer_address',
        'product_name',
        'product_spec',
        'quantity',
        'unit',
        'unit_price',
        'total_amount',
        'expected_delivery_date',
        'status',
        'payment_status',
        'remark',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'string',
            'expected_delivery_date' => 'date',
            'total_amount' => 'decimal:2',
        ];
    }

    public function greenhouse()
    {
        return $this->belongsTo(Greenhouse::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function sortingTasks()
    {
        return $this->hasMany(SortingTask::class);
    }

    public function shipments()
    {
        return $this->hasMany(Shipment::class);
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

    public function scopeByStatus(Builder $query, $status): Builder
    {
        return $query->where('status', $status);
    }
}
