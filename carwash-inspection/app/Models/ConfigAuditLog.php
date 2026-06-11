<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['config_type', 'config_id', 'action', 'old_values', 'new_values', 'changed_by', 'changed_by_name', 'ip_address'])]
class ConfigAuditLog extends Model
{
    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
        ];
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('config_type', $type);
    }

    public function scopeRecent($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    public function changer()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
