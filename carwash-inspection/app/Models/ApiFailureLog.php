<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['api_type', 'channel', 'order_no', 'request_payload', 'error_message', 'error_code', 'impact_scope', 'retry_count', 'last_retry_at', 'status', 'resolved_at'])]
class ApiFailureLog extends Model
{
    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'request_payload' => 'array',
            'impact_scope' => 'array',
            'retry_count' => 'integer',
            'last_retry_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('api_type', $type);
    }

    public function scopeUnresolved($query)
    {
        return $query->where('status', '!=', 'resolved');
    }

    public function scopeRecent($query)
    {
        return $query->orderBy('created_at', 'desc');
    }
}
