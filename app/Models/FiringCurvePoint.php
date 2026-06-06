<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FiringCurvePoint extends Model
{
    use HasFactory;

    protected $fillable = [
        'firing_curve_template_id',
        'time_minutes',
        'temperature',
        'segment_type',
        'notes',
        'sort_order',
    ];

    public function template()
    {
        return $this->belongsTo(FiringCurveTemplate::class, 'firing_curve_template_id');
    }
}
