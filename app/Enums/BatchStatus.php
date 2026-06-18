<?php

namespace App\Enums;

enum BatchStatus: string
{
    case PENDING = 'pending';
    case PROCESSING = 'processing';
    case COMPLETED = 'completed';
    case FAILED = 'failed';
    case PARTIALLY_COMPLETED = 'partially_completed';
    case RETRYING = 'retrying';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => '待处理',
            self::PROCESSING => '处理中',
            self::COMPLETED => '已完成',
            self::FAILED => '失败',
            self::PARTIALLY_COMPLETED => '部分完成',
            self::RETRYING => '重试中',
            self::CANCELLED => '已取消',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::PENDING => 'gray',
            self::PROCESSING => 'blue',
            self::COMPLETED => 'green',
            self::FAILED => 'red',
            self::PARTIALLY_COMPLETED => 'yellow',
            self::RETRYING => 'orange',
            self::CANCELLED => 'gray',
        };
    }
}
