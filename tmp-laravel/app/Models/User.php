<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'password', 'role', 'phone', 'avatar'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    use HasFactory, HasRoles, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function artClasses()
    {
        return $this->hasMany(ArtClass::class);
    }

    public function teacherProfile()
    {
        return $this->hasOne(Teacher::class);
    }

    public function studentProfile()
    {
        return $this->hasOne(Student::class);
    }

    public function givenArtworkFeedback()
    {
        return $this->hasMany(ArtworkFeedback::class, 'teacher_id');
    }

    public function homeSchoolFeedback()
    {
        return $this->hasMany(HomeSchoolFeedback::class, 'teacher_id');
    }

    public function teacherHours()
    {
        return $this->hasMany(TeacherHour::class, 'teacher_id');
    }

    public function savedFilters()
    {
        return $this->hasMany(SavedFilter::class);
    }

    public function scopeByRole($query, string $role)
    {
        return $query->where('role', $role);
    }
}
