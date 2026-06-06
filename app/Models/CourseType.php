<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CourseType extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'duration_minutes',
        'price',
        'coach_commission',
        'is_active',
        'color',
        'cover_image',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function coaches()
    {
        return $this->belongsToMany(Coach::class, 'coach_course_types')->withTimestamps();
    }

    public function packages()
    {
        return $this->hasMany(MemberCoursePackage::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}
