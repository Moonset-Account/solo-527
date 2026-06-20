<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contract extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'contract_no',
        'property_id',
        'tenant_id',
        'consultant_id',
        'start_date',
        'end_date',
        'monthly_rent',
        'deposit_amount',
        'payment_cycle',
        'status',
        'terms',
        'signed_at',
        'approved_at',
        'approved_by',
        'reject_reason',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'monthly_rent' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'signed_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function tenant()
    {
        return $this->belongsTo(User::class, 'tenant_id');
    }

    public function consultant()
    {
        return $this->belongsTo(User::class, 'consultant_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function bills()
    {
        return $this->hasMany(Bill::class);
    }

    public function deposits()
    {
        return $this->hasMany(Deposit::class);
    }

    public function followUps()
    {
        return $this->hasMany(ConsultantFollowUp::class);
    }

    public function risks()
    {
        return $this->hasMany(ContractRisk::class);
    }

    public function attachments()
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isPendingApproval(): bool
    {
        return $this->status === 'pending_approval';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
