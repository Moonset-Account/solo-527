<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'role',
        'student_id',
        'max_works_per_batch',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isTeacher(): bool
    {
        return $this->role === 'teacher';
    }

    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    public function works()
    {
        return $this->hasMany(Work::class, 'student_id');
    }

    public function createdKilnBatches()
    {
        return $this->hasMany(KilnBatch::class, 'created_by');
    }

    public function createdFiringCurves()
    {
        return $this->hasMany(FiringCurveTemplate::class, 'created_by');
    }

    public function getWorksInBatch(KilnBatch $batch): int
    {
        return $this->works()
            ->whereHas('kilnBatches', function ($query) use ($batch) {
                $query->where('kiln_batch_id', $batch->id);
            })
            ->count();
    }
}
