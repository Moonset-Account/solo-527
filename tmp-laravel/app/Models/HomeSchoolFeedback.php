<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['student_id', 'teacher_id', 'type', 'content', 'parent_reply', 'parent_read_at', 'reminded_at'])]
class HomeSchoolFeedback extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'parent_read_at' => 'datetime',
            'reminded_at' => 'datetime',
        ];
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
