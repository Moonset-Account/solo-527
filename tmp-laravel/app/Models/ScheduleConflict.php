<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['teacher_id', 'art_class_id', 'conflict_date', 'conflict_type', 'description', 'resolution', 'resolution_status', 'notified_at'])]
class ScheduleConflict extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'conflict_date' => 'date',
            'notified_at' => 'datetime',
        ];
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function artClass()
    {
        return $this->belongsTo(ArtClass::class);
    }
}
