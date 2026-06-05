<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PracticeRecording extends Model
{
    use HasFactory;
    protected $fillable = [
        'student_id',
        'assignment_id',
        'file_path',
        'duration_seconds',
        'note',
    ];

    protected $casts = [
        'duration_seconds' => 'integer',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function assignment()
    {
        return $this->belongsTo(Assignment::class);
    }

    public function annotations()
    {
        return $this->hasMany(Annotation::class);
    }

    public function scopeByStudent($query, int $studentId)
    {
        $query->where('student_id', $studentId);
    }

    public function scopeByAssignment($query, int $assignmentId)
    {
        $query->where('assignment_id', $assignmentId);
    }
}
