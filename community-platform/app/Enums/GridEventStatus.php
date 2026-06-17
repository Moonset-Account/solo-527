<?php

namespace App\Enums;

enum GridEventStatus: string
{
    case PENDING = 'pending';
    case PROCESSING = 'processing';
    case RESOLVED = 'resolved';
    case CLOSED = 'closed';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => '待处理',
            self::PROCESSING => '处理中',
            self::RESOLVED => '已解决',
            self::CLOSED => '已关闭',
        };
    }
}
