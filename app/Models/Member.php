<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Member extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'member_no',
        'gender',
        'birthday',
        'height',
        'weight',
        'fitness_goal',
        'health_condition',
        'health_notes',
        'emergency_contact',
        'notes',
        'join_date',
        'expire_date',
        'total_lessons',
        'used_lessons',
        'remaining_lessons',
    ];

    protected $casts = [
        'birthday' => 'date',
        'join_date' => 'date',
        'expire_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function packages()
    {
        return $this->hasMany(MemberCoursePackage::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function transferRequests()
    {
        return $this->hasMany(TransferRequest::class);
    }

    public function refundRequests()
    {
        return $this->hasMany(RefundRequest::class);
    }

    public function deductLesson()
    {
        if ($this->remaining_lessons > 0) {
            $this->remaining_lessons--;
            $this->used_lessons++;
            $this->save();
            return true;
        }
        return false;
    }

    public function addLesson($count = 1)
    {
        $this->remaining_lessons += $count;
        $this->total_lessons += $count;
        $this->save();
    }

    public function refundLesson($count = 1)
    {
        if ($this->used_lessons >= $count) {
            $this->used_lessons -= $count;
            $this->remaining_lessons += $count;
            $this->save();
            return true;
        }
        return false;
    }
}
