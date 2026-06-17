<?php

namespace App\Enums;

enum AssistanceRequestStatus: string
{
    case PENDING = 'pending';
    case ASSIGNED = 'assigned';
    case IN_PROGRESS = 'in_progress';
    case COMPLETED = 'completed';
    case OVERDUE = 'overdue';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => '待处理',
            self::ASSIGNED => '已分派',
            self::IN_PROGRESS => '进行中',
            self::COMPLETED => '已完成',
            self::OVERDUE => '已逾期',
        };
    }
}
