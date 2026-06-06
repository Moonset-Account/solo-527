<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Clay extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'firing_temp_min',
        'firing_temp_max',
        'atmosphere',
        'shrinkage_rate',
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
        return $this->hasMany(Work::class);
    }

    public function isCompatibleWithTemperature(int $temp): bool
    {
        return $temp >= $this->firing_temp_min && $temp <= $this->firing_temp_max;
    }
}
