<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExceptionLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'reference_id',
        'error_message',
        'status',
        'resolved_by',
        'resolved_at',
        'retry_count',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'type' => \App\Enums\ExceptionLogType::class,
            'status' => \App\Enums\ExceptionLogStatus::class,
            'resolved_at' => 'datetime',
            'payload' => 'array',
        ];
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
