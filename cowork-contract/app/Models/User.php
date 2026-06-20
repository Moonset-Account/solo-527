<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'role'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isFinance(): bool
    {
        return $this->role === 'finance';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isConsultant(): bool
    {
        return $this->role === 'consultant';
    }

    public function contracts()
    {
        return $this->hasMany(Contract::class, 'tenant_id');
    }

    public function consultingContracts()
    {
        return $this->hasMany(Contract::class, 'consultant_id');
    }

    public function followUps()
    {
        return $this->hasMany(ConsultantFollowUp::class, 'consultant_id');
    }

    public function responsibleProperties()
    {
        return $this->hasMany(Property::class, 'responsible_person_id');
    }

    public function uploadedAttachments()
    {
        return $this->hasMany(Attachment::class, 'uploaded_by');
    }

    public function approvedContracts()
    {
        return $this->hasMany(Contract::class, 'approved_by');
    }

    public function operationLogs()
    {
        return $this->hasMany(OperationLog::class);
    }

    public function assignedRisks()
    {
        return $this->hasMany(ContractRisk::class, 'assigned_to');
    }
}
