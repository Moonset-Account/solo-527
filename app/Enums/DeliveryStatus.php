<?php

namespace App\Enums;

enum DeliveryStatus: string
{
    case PENDING = 'pending';
    case IN_TRANSIT = 'in_transit';
    case DELIVERED = 'delivered';
    case PARTIALLY_DELIVERED = 'partially_delivered';
    case CONFIRMED = 'confirmed';
    case DISCREPANCY = 'discrepancy';
    case RETURNED = 'returned';
    case COMPLETED = 'completed';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => '待发货',
            self::IN_TRANSIT => '运输中',
            self::DELIVERED => '已送达',
            self::PARTIALLY_DELIVERED => '部分送达',
            self::CONFIRMED => '已确认',
            self::DISCREPANCY => '有差异',
            self::RETURNED => '已退货',
            self::COMPLETED => '已完成',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::PENDING => 'gray',
            self::IN_TRANSIT => 'blue',
            self::DELIVERED => 'green',
            self::PARTIALLY_DELIVERED => 'yellow',
            self::CONFIRMED => 'teal',
            self::DISCREPANCY => 'orange',
            self::RETURNED => 'red',
            self::COMPLETED => 'green',
        };
    }
}
