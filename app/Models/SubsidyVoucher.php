<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubsidyVoucher extends Model
{
    use HasFactory;

    protected $fillable = [
        'voucher_no',
        'greenhouse_id',
        'applicant_id',
        'subsidy_type',
        'amount',
        'apply_date',
        'status',
        'documents',
        'remark',
        'approved_by',
        'approved_at',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'documents' => 'array',
            'status' => 'string',
            'apply_date' => 'date',
            'approved_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function greenhouse()
    {
        return $this->belongsTo(Greenhouse::class);
    }

    public function applicant()
    {
        return $this->belongsTo(User::class, 'applicant_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
