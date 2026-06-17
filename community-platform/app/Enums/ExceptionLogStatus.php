<?php

namespace App\Enums;

enum ExceptionLogStatus: string
{
    case PENDING = 'pending';
    case RESOLVED = 'resolved';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => '待处理',
            self::RESOLVED => '已解决',
        };
    }
}
