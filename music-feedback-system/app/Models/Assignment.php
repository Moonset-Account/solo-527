<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    use HasFactory;
    protected $fillable = [
        'teacher_user_id',
        'student_id',
        'piece_id',
        'title',
        'description',
        'bpm_requirement',
        'beat_time_signature',
        'due_date',
        'status',
    ];

    protected $casts = [
        'due_date' => 'date',
        'bpm_requirement' => 'integer',
        'status' => 'string',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_user_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function piece()
    {
        return $this->belongsTo(Piece::class);
    }

    public function practiceRecordings()
    {
        return $this->hasMany(PracticeRecording::class);
    }

    public function parentConfirmations()
    {
        return $this->hasMany(ParentConfirmation::class);
    }

    public function approvalFlows()
    {
        return $this->morphMany(ApprovalFlow::class, 'approvable');
    }

    public function latestApproval()
    {
        return $this->morphOne(ApprovalFlow::class, 'approvable')->latestOfMany();
    }

    public function scopeByStatus($query, string $status)
    {
        $query->where('status', $status);
    }

    public function scopeByTeacher($query, int $teacherId)
    {
        $query->where('teacher_user_id', $teacherId);
    }

    public function scopeByStudent($query, int $studentId)
    {
        $query->where('student_id', $studentId);
    }

    public function scopeOverdue($query)
    {
        $query->where('due_date', '<', now())->where('status', '!=', 'completed');
    }
}
