<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\Permission\Models\Permission as SpatiePermission;

class Permission extends SpatiePermission
{
    use HasFactory;

    protected $fillable = [
        'name',
        'guard_name',
        'display_name',
        'group',
    ];

    public function getLabelAttribute(): string
    {
        $enum = \App\Enums\PermissionName::tryFrom($this->name);
        return $enum ? $enum->label() : $this->name;
    }
}
