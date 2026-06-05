<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Piece extends Model
{
    use HasFactory;
    protected $fillable = [
        'title',
        'composer',
        'instrument',
        'difficulty_level',
        'notes',
    ];

    protected $casts = [
        'difficulty_level' => 'string',
    ];

    public function assignments()
    {
        return $this->hasMany(Assignment::class);
    }

    public function scopeByInstrument($query, string $instrument)
    {
        $query->where('instrument', $instrument);
    }

    public function scopeByDifficulty($query, string $level)
    {
        $query->where('difficulty_level', $level);
    }
}
