<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Todo extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'type',
        'reference_id',
        'user_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'type' => \App\Enums\TodoType::class,
            'status' => \App\Enums\TodoStatus::class,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
