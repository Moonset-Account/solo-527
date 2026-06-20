<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'art_class_id', 'name', 'gender', 'birth_date', 'phone', 'guardian_name', 'guardian_phone', 'enrollment_date', 'status', 'notes'])]
class Student extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'enrollment_date' => 'date',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function artClass()
    {
        return $this->belongsTo(ArtClass::class);
    }

    public function artworks()
    {
        return $this->hasMany(Artwork::class);
    }

    public function homeSchoolFeedback()
    {
        return $this->hasMany(HomeSchoolFeedback::class);
    }

    public function stageReportItems()
    {
        return $this->hasMany(StageReportItem::class);
    }
}
