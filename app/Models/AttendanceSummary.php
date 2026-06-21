<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceSummary extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id', 'session_id', 'summary_date', 'registered_count',
        'confirmed_count', 'arrived_count', 'no_show_count',
        'attendance_rate', 'arrival_rate', 'seat_capacity', 'seat_sold',
        'seat_occupied', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'summary_date' => 'date',
            'attendance_rate' => 'decimal:4',
            'arrival_rate' => 'decimal:4',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(EventSession::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
