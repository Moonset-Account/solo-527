<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Cache;

class Event extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'theme', 'description', 'location', 'address',
        'start_time', 'end_time', 'organizer', 'undertaker',
        'expected_count', 'cover_image', 'tags', 'status', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'tags' => 'array',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(EventSession::class);
    }

    public function seats(): HasMany
    {
        return $this->hasMany(EventSeat::class);
    }

    public function ticketTypes(): HasMany
    {
        return $this->hasMany(TicketType::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    public function duplicateSeatRecords(): HasMany
    {
        return $this->hasMany(DuplicateSeatRecord::class);
    }

    public function refundRequests(): HasMany
    {
        return $this->hasMany(RefundRequest::class);
    }

    public function attendanceFeedbacks(): HasMany
    {
        return $this->hasMany(AttendanceFeedback::class);
    }

    public function conversionSummaries(): HasMany
    {
        return $this->hasMany(ConversionSummary::class);
    }

    public function attendanceSummaries(): HasMany
    {
        return $this->hasMany(AttendanceSummary::class);
    }

    public function exportRecords(): HasMany
    {
        return $this->hasMany(ExportRecord::class);
    }

    public function systemConfigs(): HasMany
    {
        return $this->hasMany(SystemConfig::class);
    }

    public function getCachedStats(): array
    {
        return Cache::remember("event:{$this->id}:stats", 300, function () {
            return [
                'registered_count' => $this->registrations()->count(),
                'confirmed_count' => $this->registrations()->whereIn('registration_status', ['approved', 'paid'])->count(),
                'paid_count' => $this->registrations()->where('conversion_stage', 'paid')->count(),
                'arrived_count' => $this->registrations()->where('attendance_status', 'arrived')->count(),
                'paid_total' => $this->registrations()->sum('paid_amount'),
            ];
        });
    }
}
