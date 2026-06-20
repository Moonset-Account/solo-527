<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['teacher_id', 'art_class_id', 'date', 'start_time', 'end_time', 'hours', 'type', 'status', 'notes'])]
class TeacherHour extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'start_time' => 'datetime:H:i',
            'end_time' => 'datetime:H:i',
            'hours' => 'decimal:2',
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
