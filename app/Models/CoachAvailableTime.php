<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CoachAvailableTime extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'coach_id',
        'day_of_week',
        'start_time',
        'end_time',
        'is_recurring',
        'specific_date',
        'is_active',
    ];

    protected $casts = [
        'is_recurring' => 'boolean',
        'is_active' => 'boolean',
        'specific_date' => 'date',
    ];

    public function coach()
    {
        return $this->belongsTo(Coach::class);
    }
}
