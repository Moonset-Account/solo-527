<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'instrument',
        'parent_user_id',
        'teacher_user_id',
        'status',
    ];

    protected $casts = [
        'status' => 'string',
    ];

    public function parent()
    {
        return $this->belongsTo(User::class, 'parent_user_id');
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_user_id');
    }

    public function assignments()
    {
        return $this->hasMany(Assignment::class);
    }

    public function practiceRecordings()
    {
        return $this->hasMany(PracticeRecording::class);
    }

    public function parentConfirmations()
    {
        return $this->hasMany(ParentConfirmation::class);
    }

    public function paymentReminders()
    {
        return $this->hasMany(PaymentReminder::class);
    }

    public function scopeByInstrument($query, string $instrument)
    {
        $query->where('instrument', $instrument);
    }

    public function scopeByStatus($query, string $status)
    {
        $query->where('status', $status);
    }

    public function scopeByTeacher($query, int $teacherId)
    {
        $query->where('teacher_user_id', $teacherId);
    }

    public function scopeByParent($query, int $parentId)
    {
        $query->where('parent_user_id', $parentId);
    }
}
