<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role', 'phone'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => 'string',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isTeacher(): bool
    {
        return $this->role === 'teacher';
    }

    public function isParent(): bool
    {
        return $this->role === 'parent';
    }

    public function studentsAsParent()
    {
        return $this->hasMany(Student::class, 'parent_user_id');
    }

    public function studentsAsTeacher()
    {
        return $this->hasMany(Student::class, 'teacher_user_id');
    }

    public function annotations()
    {
        return $this->hasMany(Annotation::class, 'teacher_user_id');
    }

    public function parentConfirmations()
    {
        return $this->hasMany(ParentConfirmation::class, 'parent_user_id');
    }

    public function savedFilters()
    {
        return $this->hasMany(SavedFilter::class, 'user_id');
    }

    public function approvalFlows()
    {
        return $this->hasMany(ApprovalFlow::class, 'approver_user_id');
    }

    public function scopeByRole($query, string $role)
    {
        $query->where('role', $role);
    }
}
