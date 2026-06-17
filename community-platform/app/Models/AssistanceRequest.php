<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssistanceRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'resident_id',
        'status',
        'department_id',
        'handler_id',
        'deadline',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => \App\Enums\AssistanceRequestStatus::class,
            'deadline' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function resident(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resident_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handler_id');
    }
}
