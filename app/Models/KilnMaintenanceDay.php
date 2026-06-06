<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KilnMaintenanceDay extends Model
{
    use HasFactory;

    protected $fillable = [
        'kiln_id',
        'maintenance_date',
        'reason',
        'is_recurring_weekly',
        'day_of_week',
    ];

    protected function casts(): array
    {
        return [
            'maintenance_date' => 'date',
            'is_recurring_weekly' => 'boolean',
        ];
    }

    public function kiln()
    {
        return $this->belongsTo(Kiln::class);
    }
}
