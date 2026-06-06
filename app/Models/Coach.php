<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Coach extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'employee_no',
        'gender',
        'specialties',
        'certifications',
        'experience_years',
        'bio',
        'rating',
        'total_students',
        'total_lessons',
    ];

    protected $casts = [
        'specialties' => 'array',
        'certifications' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function courseTypes()
    {
        return $this->belongsToMany(CourseType::class, 'coach_course_types')->withTimestamps();
    }

    public function availableTimes()
    {
        return $this->hasMany(CoachAvailableTime::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function revenueLogs()
    {
        return $this->hasMany(CoachRevenueLog::class);
    }

    public function incrementLessonCount()
    {
        $this->total_lessons++;
        $this->save();
    }

    public function isAvailableAt($dateTime)
    {
        $dayOfWeek = $dateTime->dayOfWeek;
        $time = $dateTime->format('H:i:s');

        return $this->availableTimes()
            ->where('day_of_week', $dayOfWeek)
            ->where('start_time', '<=', $time)
            ->where('end_time', '>=', $time)
            ->where('is_active', true)
            ->exists();
    }
}
