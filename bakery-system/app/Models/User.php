<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Permission\Traits\HasRoles;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes, HasRoles, HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'user_type',
        'is_active',
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
        ];
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'customer_id');
    }

    public function assignedOrders()
    {
        return $this->hasMany(Order::class, 'assigned_to');
    }

    public function createdOrders()
    {
        return $this->hasMany(Order::class, 'created_by');
    }

    public function productionSchedules()
    {
        return $this->hasMany(ProductionSchedule::class, 'assigned_to');
    }

    public function isAdmin()
    {
        return $this->user_type === 'admin';
    }

    public function isStaff()
    {
        return $this->user_type === 'staff';
    }

    public function isCustomer()
    {
        return $this->user_type === 'customer';
    }
}
