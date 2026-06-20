<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['student_name', 'phone', 'art_class_id', 'preferred_date', 'preferred_time', 'status', 'source', 'notes', 'converted', 'converted_at'])]
class TrialBooking extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'preferred_date' => 'date',
            'converted' => 'boolean',
            'converted_at' => 'datetime',
        ];
    }

    public function artClass()
    {
        return $this->belongsTo(ArtClass::class);
    }

    public function enrollmentConversion()
    {
        return $this->hasOne(EnrollmentConversion::class);
    }
}
