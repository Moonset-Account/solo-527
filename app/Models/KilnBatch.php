<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KilnBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'batch_number',
        'kiln_id',
        'firing_curve_template_id',
        'created_by',
        'scheduled_fire_date',
        'actual_fire_date',
        'cooled_down_date',
        'unloaded_date',
        'status',
        'max_capacity',
        'used_space_percent',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_fire_date' => 'datetime',
            'actual_fire_date' => 'datetime',
            'cooled_down_date' => 'datetime',
            'unloaded_date' => 'datetime',
        ];
    }

    public function kiln()
    {
        return $this->belongsTo(Kiln::class);
    }

    public function firingCurveTemplate()
    {
        return $this->belongsTo(FiringCurveTemplate::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function works()
    {
        return $this->belongsToMany(Work::class, 'kiln_batch_works')
            ->withPivot([
                'position_shelf',
                'position_zone',
                'position_x',
                'position_y',
                'space_occupied',
                'post_firing_status',
                'post_firing_notes',
            ])
            ->withTimestamps();
    }

    public function batchWorks()
    {
        return $this->hasMany(KilnBatchWork::class);
    }

    public function getWorkCountAttribute(): int
    {
        return $this->works()->count();
    }

    public function getRemainingCapacityAttribute(): int
    {
        return max(0, $this->max_capacity - $this->work_count);
    }

    public function isEditable(): bool
    {
        return in_array($this->status, ['draft', 'scheduled']);
    }

    public function canAddWork(): bool
    {
        return $this->isEditable() && $this->remaining_capacity > 0;
    }

    public function calculateUsedSpacePercent(): float
    {
        $totalSpace = $this->batchWorks->sum('space_occupied');
        $kilnVolume = $this->kiln?->getTotalVolume() ?? 1;

        return min(100, round(($totalSpace / $kilnVolume) * 100, 2));
    }

    public function updateSpaceUsage(): void
    {
        $this->used_space_percent = $this->calculateUsedSpacePercent();
        $this->save();
    }

    public function getStudentWorkCount(int $studentId): int
    {
        return $this->works()
            ->where('student_id', $studentId)
            ->count();
    }

    public function getUniqueGlazes()
    {
        $glazeIds = $this->works()
            ->with('glazes')
            ->get()
            ->pluck('glazes.*.id')
            ->flatten()
            ->unique()
            ->values();

        return Glaze::whereIn('id', $glazeIds)->get();
    }

    public static function generateBatchNumber(): string
    {
        $prefix = date('Ymd');
        $lastBatch = self::where('batch_number', 'like', $prefix . '%')
            ->latest('id')
            ->first();

        $sequence = $lastBatch ? (int) substr($lastBatch->batch_number, -3) + 1 : 1;

        return $prefix . str_pad($sequence, 3, '0', STR_PAD_LEFT);
    }

    protected static function booted(): void
    {
        static::creating(function (self $batch) {
            if (empty($batch->batch_number)) {
                $batch->batch_number = self::generateBatchNumber();
            }
        });
    }
}
