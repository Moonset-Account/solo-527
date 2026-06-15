<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GapHandlingLog extends Model
{
    protected $fillable = [
        'compliance_gap_id',
        'user_id',
        'action_type',
        'old_value',
        'new_value',
        'comment',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function complianceGap(): BelongsTo
    {
        return $this->belongsTo(ComplianceGap::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getActionLabelAttribute(): string
    {
        $labels = [
            'created' => '创建',
            'status_changed' => '状态变更',
            'comment' => '评论',
            'evidence_added' => '添加证据',
            'assignee_changed' => '责任人变更',
            'due_date_changed' => '期限变更',
            'severity_changed' => '严重程度变更',
        ];

        return $labels[$this->action_type] ?? $this->action_type;
    }
}
