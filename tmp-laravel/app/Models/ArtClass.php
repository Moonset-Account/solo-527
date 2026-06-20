<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'type', 'level', 'teacher_id', 'start_date', 'end_date', 'schedule', 'max_students', 'status', 'description'])]
class ArtClass extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'schedule' => 'array',
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function artworks()
    {
        return $this->hasMany(Artwork::class);
    }

    public function stageReports()
    {
        return $this->hasMany(StageReport::class);
    }

    public function trialBookings()
    {
        return $this->hasMany(TrialBooking::class);
    }

    public function teacherHours()
    {
        return $this->hasMany(TeacherHour::class);
    }

    public function scheduleConflicts()
    {
        return $this->hasMany(ScheduleConflict::class);
    }

    public function enrollmentConversions()
    {
        return $this->hasMany(EnrollmentConversion::class);
    }
}
