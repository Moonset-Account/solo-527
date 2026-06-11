<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['order_no', 'work_order_id', 'vehicle_id', 'service_item_id', 'amount', 'payment_method', 'payment_status', 'paid_at', 'operator_id', 'operator_name', 'notes'])]
class CashierOrder extends Model
{
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function scopeUnpaid($query)
    {
        return $query->where('payment_status', 'unpaid');
    }

    public function scopeToday($query)
    {
        return $query->whereDate('created_at', today());
    }

    public function workOrder()
    {
        return $this->belongsTo(WorkOrder::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function serviceItem()
    {
        return $this->belongsTo(ServiceItem::class);
    }

    public function operator()
    {
        return $this->belongsTo(User::class, 'operator_id');
    }
}
