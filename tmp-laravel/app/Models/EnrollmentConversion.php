<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['trial_booking_id', 'student_id', 'art_class_id', 'converted_at', 'conversion_type', 'follow_up_notes', 'operator_id'])]
class EnrollmentConversion extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'converted_at' => 'datetime',
        ];
    }

    public function trialBooking()
    {
        return $this->belongsTo(TrialBooking::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function artClass()
    {
        return $this->belongsTo(ArtClass::class);
    }

    public function operator()
    {
        return $this->belongsTo(User::class, 'operator_id');
    }
}
