<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Glaze extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'color',
        'description',
        'firing_temp_min',
        'firing_temp_max',
        'atmosphere',
        'finish',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function works()
    {
        return $this->belongsToMany(Work::class, 'work_glazes')
            ->withPivot(['layer_number', 'notes'])
            ->withTimestamps();
    }

    public function compatibilities()
    {
        return $this->hasMany(GlazeCompatibility::class, 'glaze1_id');
    }

    public function inverseCompatibilities()
    {
        return $this->hasMany(GlazeCompatibility::class, 'glaze2_id');
    }

    public function getCompatibilityWith(Glaze $otherGlaze): string
    {
        $compatibility = GlazeCompatibility::where(function ($query) use ($otherGlaze) {
            $query->where('glaze1_id', $this->id)
                  ->where('glaze2_id', $otherGlaze->id);
        })->orWhere(function ($query) use ($otherGlaze) {
            $query->where('glaze1_id', $otherGlaze->id)
                  ->where('glaze2_id', $this->id);
        })->first();

        return $compatibility?->compatibility ?? 'compatible';
    }

    public function isCompatibleWithTemperature(int $temp): bool
    {
        return $temp >= $this->firing_temp_min && $temp <= $this->firing_temp_max;
    }
}
