<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class EventSession extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'event_id', 'name', 'venue', 'start_time', 'end_time',
        'speaker', 'agenda', 'capacity', 'seat_count', 'sort_order',
        'is_active', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function seats(): HasMany
    {
        return $this->hasMany(EventSeat::class, 'session_id');
    }

    public function registrationPivots(): HasMany
    {
        return $this->hasMany(RegistrationSessionPivot::class, 'session_id');
    }

    public function attendanceSummaries(): HasMany
    {
        return $this->hasMany(AttendanceSummary::class, 'session_id');
    }

    public function duplicateSeatRecords(): HasMany
    {
        return $this->hasMany(DuplicateSeatRecord::class, 'session_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
