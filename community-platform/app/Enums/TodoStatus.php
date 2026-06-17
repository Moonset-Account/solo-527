<?php

namespace App\Enums;

enum TodoStatus: string
{
    case PENDING = 'pending';
    case DONE = 'done';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => '待办',
            self::DONE => '已完成',
        };
    }
}
