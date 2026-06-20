<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Deposit extends Model
{
    protected $fillable = [
        'contract_id',
        'amount',
        'status',
        'collected_date',
        'refunded_date',
        'remark',
        'operator_id',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'collected_date' => 'date',
            'refunded_date' => 'date',
        ];
    }

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function operator()
    {
        return $this->belongsTo(User::class, 'operator_id');
    }
}
