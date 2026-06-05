<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParentConfirmation extends Model
{
    protected $fillable = [
        'parent_user_id',
        'assignment_id',
        'student_id',
        'confirmed',
        'note',
    ];

    protected $casts = [
        'confirmed' => 'boolean',
    ];

    public function parent()
    {
        return $this->belongsTo(User::class, 'parent_user_id');
    }

    public function assignment()
    {
        return $this->belongsTo(Assignment::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function scopeByParent($query, int $parentId)
    {
        $query->where('parent_user_id', $parentId);
    }

    public function scopeByAssignment($query, int $assignmentId)
    {
        $query->where('assignment_id', $assignmentId);
    }

    public function scopePending($query)
    {
        $query->where('confirmed', false);
    }
}
