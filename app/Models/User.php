<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
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

    public function ownedLeads()
    {
        return $this->hasMany(Lead::class, 'owner_id');
    }

    public function assignedLeads()
    {
        return $this->hasMany(Lead::class, 'assignee_id');
    }

    public function consultations()
    {
        return $this->hasMany(Consultation::class, 'operator_id');
    }

    public function responseNodes()
    {
        return $this->hasMany(ResponseNode::class, 'operator_id');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isOperator(): bool
    {
        return $this->role === 'operator';
    }
}
