<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RegistrationSessionPivot extends Model
{
    use HasFactory;

    protected $table = 'registration_session_pivots';

    protected $fillable = [
        'registration_id', 'session_id', 'seat_id', 'attendance_status',
        'checked_in_at', 'check_in_method', 'checked_in_by', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'checked_in_at' => 'datetime',
        ];
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(EventSession::class);
    }

    public function seat(): BelongsTo
    {
        return $this->belongsTo(EventSeat::class);
    }

    public function checkedInBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_in_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
