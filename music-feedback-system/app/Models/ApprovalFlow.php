<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApprovalFlow extends Model
{
    protected $fillable = [
        'approvable_type',
        'approvable_id',
        'approver_user_id',
        'action',
        'comment',
    ];

    protected $casts = [
        'action' => 'string',
    ];

    public function approvable()
    {
        return $this->morphTo();
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_user_id');
    }

    public function scopeByAction($query, string $action)
    {
        $query->where('action', $action);
    }

    public function scopeByApprover($query, int $userId)
    {
        $query->where('approver_user_id', $userId);
    }
}
