<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResponseNode extends Model
{
    use HasFactory;

    protected $fillable = [
        'lead_id',
        'node_type',
        'content',
        'operator_id',
    ];

    protected static array $nodeTypeLabels = [
        'first_contact' => '首次联系',
        'consultation' => '咨询沟通',
        'quote_sent' => '发送报价',
        'follow_up' => '后续跟进',
        'contract_sent' => '发送合同',
        'contract_signed' => '合同签署',
        'treatment_arranged' => '安排治疗',
        'lost' => '确认流失',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function operator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'operator_id');
    }

    public function getNodeTypeLabelAttribute(): string
    {
        return static::$nodeTypeLabels[$this->node_type] ?? $this->node_type;
    }

    public static function getNodeTypeLabels(): array
    {
        return static::$nodeTypeLabels;
    }
}
