<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'employee_code',
        'department',
        'position',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
    ];

    public function customers()
    {
        return $this->hasMany(Customer::class, 'salesperson_id');
    }

    public function createdOrders()
    {
        return $this->hasMany(Order::class, 'created_by');
    }

    public function confirmedOrders()
    {
        return $this->hasMany(Order::class, 'confirmed_by');
    }

    public function pickingLists()
    {
        return $this->hasMany(PickingList::class, 'picker_id');
    }

    public function createdPickingLists()
    {
        return $this->hasMany(PickingList::class, 'created_by');
    }

    public function debts()
    {
        return $this->hasMany(Debt::class, 'created_by');
    }

    public function debtPayments()
    {
        return $this->hasMany(DebtPayment::class, 'created_by');
    }

    public function returns()
    {
        return $this->hasMany(ReturnRequest::class, 'created_by');
    }

    public function approvedReturns()
    {
        return $this->hasMany(ReturnRequest::class, 'approved_by');
    }

    public function statements()
    {
        return $this->hasMany(Statement::class, 'created_by');
    }

    public function importExportTasks()
    {
        return $this->hasMany(ImportExportTask::class, 'created_by');
    }

    public function auditTrails()
    {
        return $this->hasMany(AuditTrail::class);
    }
}
