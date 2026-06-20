<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['student_id', 'art_class_id', 'teacher_id', 'title', 'description', 'image_path', 'submitted_at', 'status'])]
class Artwork extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
        ];
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function artClass()
    {
        return $this->belongsTo(ArtClass::class);
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function feedback()
    {
        return $this->hasMany(ArtworkFeedback::class);
    }
}
