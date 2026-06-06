<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GlazeCompatibility extends Model
{
    use HasFactory;

    protected $fillable = [
        'glaze1_id',
        'glaze2_id',
        'compatibility',
        'notes',
    ];

    public function glaze1()
    {
        return $this->belongsTo(Glaze::class, 'glaze1_id');
    }

    public function glaze2()
    {
        return $this->belongsTo(Glaze::class, 'glaze2_id');
    }
}
