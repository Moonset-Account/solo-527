<?php

namespace App\Enums;

enum ExceptionLogType: string
{
    case NOTIFICATION = 'notification';
    case PAYMENT = 'payment';

    public function label(): string
    {
        return match ($this) {
            self::NOTIFICATION => '通知',
            self::PAYMENT => '支付',
        };
    }
}
