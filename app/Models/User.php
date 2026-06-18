<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'avatar',
        'status',
        'department',
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

    public function greenhouses()
    {
        return $this->hasMany(Greenhouse::class, 'manager_id');
    }

    public function subsidyVouchers()
    {
        return $this->hasMany(SubsidyVoucher::class, 'applicant_id');
    }

    public function machineryAppointments()
    {
        return $this->hasMany(MachineryAppointment::class, 'applicant_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'created_by');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    public function savedFilters()
    {
        return $this->hasMany(SavedFilter::class);
    }

    public function sortingTasks()
    {
        return $this->hasMany(SortingTask::class, 'assigned_to');
    }
}
