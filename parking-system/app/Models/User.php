<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'email', 'phone', 'password', 'role', 'avatar', 'balance', 'is_active'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'balance' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function parkingSpots(): HasMany
    {
        return $this->hasMany(ParkingSpot::class, 'owner_id');
    }

    public function bookingsAsVisitor(): HasMany
    {
        return $this->hasMany(Booking::class, 'visitor_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function settlements(): HasMany
    {
        return $this->hasMany(Settlement::class, 'owner_id');
    }

    public function violationAppeals(): HasMany
    {
        return $this->hasMany(ViolationAppeal::class, 'appellant_id');
    }

    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    public function isVisitor(): bool
    {
        return $this->role === 'visitor';
    }

    public function isProperty(): bool
    {
        return $this->role === 'property';
    }

    public function isSecurity(): bool
    {
        return $this->role === 'security';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
