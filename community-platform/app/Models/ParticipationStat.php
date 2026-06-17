<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParticipationStat extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'stat_date',
        'event_count',
        'issue_count',
        'vote_count',
        'assistance_count',
        'todo_count',
    ];

    protected function casts(): array
    {
        return [
            'stat_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
