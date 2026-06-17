<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PublicNotice extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'content',
        'type',
        'reference_id',
        'published_by',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => \App\Enums\PublicNoticeType::class,
            'published_at' => 'datetime',
        ];
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by');
    }
}
