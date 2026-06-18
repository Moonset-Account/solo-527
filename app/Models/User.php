<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'department',
        'position',
        'employee_no',
        'avatar',
        'manager_id',
        'is_active',
        'last_login_at',
        'supplier_id',
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
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function purchaseRequests()
    {
        return $this->hasMany(PurchaseRequest::class, 'requester_id');
    }

    public function approvalRecords()
    {
        return $this->hasMany(ApprovalRecord::class, 'approver_id');
    }

    public function quotations()
    {
        return $this->hasMany(Quotation::class, 'created_by');
    }

    public function financialReviews()
    {
        return $this->hasMany(FinancialReview::class, 'reviewer_id');
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole(\App\Enums\RoleName::SUPER_ADMIN->value);
    }

    public function isAdmin(): bool
    {
        return $this->hasAnyRole([
            \App\Enums\RoleName::SUPER_ADMIN->value,
            \App\Enums\RoleName::ADMIN->value,
        ]);
    }

    public function isProcurementStaff(): bool
    {
        return $this->hasAnyRole([
            \App\Enums\RoleName::PROCUREMENT_MANAGER->value,
            \App\Enums\RoleName::PROCUREMENT_STAFF->value,
        ]);
    }

    public function isFinancialStaff(): bool
    {
        return $this->hasAnyRole([
            \App\Enums\RoleName::FINANCIAL_MANAGER->value,
            \App\Enums\RoleName::FINANCIAL_STAFF->value,
        ]);
    }

    public function isWarehouseStaff(): bool
    {
        return $this->hasAnyRole([
            \App\Enums\RoleName::WAREHOUSE_MANAGER->value,
            \App\Enums\RoleName::WAREHOUSE_STAFF->value,
        ]);
    }

    public function isSupplier(): bool
    {
        return $this->hasRole(\App\Enums\RoleName::SUPPLIER->value) && $this->supplier_id !== null;
    }
}
