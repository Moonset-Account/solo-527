<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContractRisk extends Model
{
    protected $fillable = [
        'contract_id',
        'risk_type',
        'severity',
        'description',
        'status',
        'assigned_to',
        'resolved_at',
        'resolved_by',
        'close_remark',
    ];

    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
        ];
    }

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function resolvedBy()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function isOpen(): bool
    {
        return $this->status === 'open';
    }
}
