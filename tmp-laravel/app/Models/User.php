<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'role', 'department'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    const ROLE_ADMIN = 'admin';
    const ROLE_COMPLIANCE_MANAGER = 'compliance_manager';
    const ROLE_PROJECT_SECRETARY = 'project_secretary';
    const ROLE_USER = 'user';

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isComplianceManager(): bool
    {
        return $this->role === self::ROLE_COMPLIANCE_MANAGER || $this->isAdmin();
    }

    public function isProjectSecretary(): bool
    {
        return $this->role === self::ROLE_PROJECT_SECRETARY || $this->isComplianceManager();
    }

    public function submittedChecklists(): HasMany
    {
        return $this->hasMany(ChecklistRecord::class, 'submitted_by');
    }

    public function reviewedChecklists(): HasMany
    {
        return $this->hasMany(ChecklistRecord::class, 'reviewed_by');
    }

    public function responsibleGaps(): HasMany
    {
        return $this->hasMany(ComplianceGap::class, 'responsible_user_id');
    }

    public function createdGaps(): HasMany
    {
        return $this->hasMany(ComplianceGap::class, 'created_by');
    }

    public function gapHandlingLogs(): HasMany
    {
        return $this->hasMany(GapHandlingLog::class);
    }

    public function savedFilters(): HasMany
    {
        return $this->hasMany(SavedFilter::class);
    }

    public function downloadLogs(): HasMany
    {
        return $this->hasMany(DownloadLog::class);
    }

    public function reminderLogs(): HasMany
    {
        return $this->hasMany(ReminderLog::class, 'recipient_id');
    }

    public function unreadReminders(): HasMany
    {
        return $this->reminderLogs()->whereNull('read_at');
    }
}
