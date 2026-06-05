<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Annotation extends Model
{
    protected $fillable = [
        'teacher_user_id',
        'practice_recording_id',
        'timestamp_ms',
        'content',
    ];

    protected $casts = [
        'timestamp_ms' => 'integer',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_user_id');
    }

    public function practiceRecording()
    {
        return $this->belongsTo(PracticeRecording::class);
    }

    public function scopeByRecording($query, int $recordingId)
    {
        $query->where('practice_recording_id', $recordingId);
    }

    public function scopeByTeacher($query, int $teacherId)
    {
        $query->where('teacher_user_id', $teacherId);
    }
}
