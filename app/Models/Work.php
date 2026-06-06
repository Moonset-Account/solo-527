<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Work extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'student_id',
        'clay_id',
        'description',
        'width',
        'height',
        'depth',
        'estimated_volume',
        'temperature_zone_preference',
        'status',
        'for_exhibition',
        'breakage_reason',
        'compensation_status',
        'compensation_notes',
    ];

    protected function casts(): array
    {
        return [
            'for_exhibition' => 'boolean',
        ];
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function clay()
    {
        return $this->belongsTo(Clay::class);
    }

    public function glazes()
    {
        return $this->belongsToMany(Glaze::class, 'work_glazes')
            ->withPivot(['layer_number', 'notes'])
            ->withTimestamps()
            ->orderBy('layer_number');
    }

    public function kilnBatches()
    {
        return $this->belongsToMany(KilnBatch::class, 'kiln_batch_works')
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

    public function photos()
    {
        return $this->hasMany(WorkPhoto::class)->orderBy('sort_order');
    }

    public function getCurrentBatchAttribute()
    {
        return $this->kilnBatches()
            ->whereNotIn('status', ['cancelled'])
            ->latest()
            ->first();
    }

    public function getIsScheduledAttribute(): bool
    {
        return $this->current_batch !== null;
    }

    public function calculateVolume(): float
    {
        if ($this->estimated_volume) {
            return (float) $this->estimated_volume;
        }

        return (float) ($this->width * $this->height * $this->depth);
    }

    public function getSuitableTemperature(): int
    {
        $clayTemp = $this->clay?->firing_temp_min ?? 1200;

        $glazeTemps = $this->glazes->map->firing_temp_min->filter();
        if ($glazeTemps->isNotEmpty()) {
            return max($clayTemp, $glazeTemps->max());
        }

        return $clayTemp;
    }

    public function canBeScheduled(): bool
    {
        return in_array($this->status, ['ready_for_firing', 'scheduled']) && !$this->is_scheduled;
    }

    public function isVisibleTo(User $user): bool
    {
        if ($user->isTeacher()) {
            return true;
        }

        if ($user->isStudent() && $this->student_id === $user->id) {
            return true;
        }

        return false;
    }

    public function canViewFailureDetails(User $user): bool
    {
        if ($user->isTeacher()) {
            return true;
        }

        return false;
    }
}
