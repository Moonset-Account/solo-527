<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

#[Fillable([
    'name',
    'email',
    'password',
    'role',
    'phone',
    'department',
    'position',
    'is_on_duty',
    'last_active_at',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_active_at' => 'datetime',
            'is_on_duty' => 'boolean',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin' || $this->role === 'manager';
    }

    public function isEngineer(): bool
    {
        return $this->role === 'engineer';
    }

    public function alertsAcknowledged()
    {
        return $this->hasMany(Alert::class, 'acknowledged_by');
    }

    public function alertsProcessed()
    {
        return $this->hasMany(Alert::class, 'processed_by');
    }

    public function alertsClosed()
    {
        return $this->hasMany(Alert::class, 'closed_by');
    }

    public function dutySchedules()
    {
        return $this->hasMany(DutySchedule::class);
    }

    public function createdDutySchedules()
    {
        return $this->hasMany(DutySchedule::class, 'created_by');
    }

    public function savedQueries()
    {
        return $this->hasMany(SavedQuery::class);
    }

    public function accountApplications()
    {
        return $this->hasMany(AccountApplication::class, 'applicant_id');
    }

    public function approvals()
    {
        return $this->hasMany(AccountApplication::class, 'approver_id');
    }

    public function changeWindows()
    {
        return $this->hasMany(ChangeWindow::class, 'created_by');
    }

    public function operationLogs()
    {
        return $this->hasMany(OperationLog::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function alertComments()
    {
        return $this->hasMany(AlertComment::class);
    }

    public function inspectionRecords()
    {
        return $this->hasMany(InspectionRecord::class);
    }

    public function unreadNotificationsCount()
    {
        return $this->notifications()->whereNull('read_at')->count();
    }

    public function scopeOnDuty($query)
    {
        return $query->where('is_on_duty', true);
    }

    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }
}
