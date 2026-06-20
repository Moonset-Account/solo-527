<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsultantFollowUp extends Model
{
    protected $fillable = [
        'contract_id',
        'consultant_id',
        'property_id',
        'type',
        'content',
        'followed_up_at',
    ];

    protected function casts(): array
    {
        return [
            'followed_up_at' => 'datetime',
        ];
    }

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function consultant()
    {
        return $this->belongsTo(User::class, 'consultant_id');
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }
}
