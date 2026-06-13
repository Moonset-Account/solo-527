<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OceanRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'days_unassigned',
        'days_no_follow',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'days_unassigned' => 'integer',
        'days_no_follow' => 'integer',
    ];
}
