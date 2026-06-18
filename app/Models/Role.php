<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    use HasFactory;

    protected $fillable = [
        'name',
        'guard_name',
        'display_name',
        'description',
    ];

    public function getLabelAttribute(): string
    {
        $enum = \App\Enums\RoleName::tryFrom($this->name);
        return $enum ? $enum->label() : $this->name;
    }

    public function getDescriptionTextAttribute(): string
    {
        $enum = \App\Enums\RoleName::tryFrom($this->name);
        return $enum ? $enum->description() : ($this->description ?? '');
    }
}
