<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MemberCoursePackage extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'member_id',
        'course_type_id',
        'package_name',
        'total_lessons',
        'used_lessons',
        'remaining_lessons',
        'unit_price',
        'total_amount',
        'paid_amount',
        'purchase_date',
        'expire_date',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'expire_date' => 'date',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function courseType()
    {
        return $this->belongsTo(CourseType::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'package_id');
    }

    public function refundRequests()
    {
        return $this->hasMany(RefundRequest::class, 'package_id');
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
