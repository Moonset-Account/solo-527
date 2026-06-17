<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'department_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => \App\Enums\UserRole::class,
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function gridEventsAsReporter(): HasMany
    {
        return $this->hasMany(GridEvent::class, 'reporter_id');
    }

    public function gridEventsAsHandler(): HasMany
    {
        return $this->hasMany(GridEvent::class, 'handler_id');
    }

    public function issuesAsReporter(): HasMany
    {
        return $this->hasMany(Issue::class, 'reporter_id');
    }

    public function issuesAsAssigner(): HasMany
    {
        return $this->hasMany(Issue::class, 'assigner_id');
    }

    public function issueVotes(): HasMany
    {
        return $this->hasMany(IssueVote::class);
    }

    public function assistanceRequests(): HasMany
    {
        return $this->hasMany(AssistanceRequest::class, 'resident_id');
    }

    public function todos(): HasMany
    {
        return $this->hasMany(Todo::class);
    }

    public function participationStats(): HasMany
    {
        return $this->hasMany(ParticipationStat::class);
    }
}
