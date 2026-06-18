<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubsidyVoucher extends Model
{
    use HasFactory;

    protected static function booted()
    {
        static::creating(function ($voucher) {
            if (empty($voucher->voucher_no)) {
                $prefix = 'SV' . now()->format('Ymd');
                $latest = static::where('voucher_no', 'like', "{$prefix}%")
                    ->orderByRaw('CAST(SUBSTRING(voucher_no, 11) AS UNSIGNED) desc')
                    ->first();
                $next = $latest ? (int) substr($latest->voucher_no, 10) + 1 : 1;
                $voucher->voucher_no = $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
            }
        });
    }

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
