<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['report_date', 'work_order_id', 'vehicle_id', 'technician_id', 'service_item', 'inspection_pass_count', 'inspection_fail_count', 'inspection_warning_count', 'no_show', 'no_show_reason', 'overall_score', 'remarks', 'generated_by'])]
class QualityReport extends Model
{
    protected function casts(): array
    {
        return [
            'report_date' => 'date',
            'inspection_pass_count' => 'integer',
            'inspection_fail_count' => 'integer',
            'inspection_warning_count' => 'integer',
            'no_show' => 'boolean',
            'overall_score' => 'decimal:2',
        ];
    }

    public function scopeByDate($query, string $date)
    {
        return $query->where('report_date', $date);
    }

    public function scopeByTechnician($query, int $techId)
    {
        return $query->where('technician_id', $techId);
    }

    public function workOrder()
    {
        return $this->belongsTo(WorkOrder::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function technician()
    {
        return $this->belongsTo(Technician::class);
    }

    public function generator()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}
