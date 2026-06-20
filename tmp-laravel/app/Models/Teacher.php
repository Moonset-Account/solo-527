<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'name', 'specialty', 'phone', 'hourly_rate', 'status'])]
class Teacher extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'hourly_rate' => 'decimal:2',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function artClasses()
    {
        return $this->hasMany(ArtClass::class, 'teacher_id');
    }

    public function teacherHours()
    {
        return $this->hasMany(TeacherHour::class, 'teacher_id');
    }
}
