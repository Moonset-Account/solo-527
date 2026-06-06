<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PickingScan extends Model
{
    protected $fillable = [
        'picking_item_id',
        'picker_id',
        'barcode',
        'quantity',
        'scan_type',
        'device_info',
    ];

    const SCAN_TYPE_PICK = 'pick';
    const SCAN_TYPE_VERIFY = 'verify';

    public function pickingItem()
    {
        return $this->belongsTo(PickingItem::class);
    }

    public function picker()
    {
        return $this->belongsTo(User::class, 'picker_id');
    }

    public function getScanTypeTextAttribute()
    {
        $typeMap = [
            self::SCAN_TYPE_PICK => '拣货',
            self::SCAN_TYPE_VERIFY => '复核',
        ];
        return $typeMap[$this->scan_type] ?? $this->scan_type;
    }
}
