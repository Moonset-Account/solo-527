<?php

namespace App\Enums;

enum TodoType: string
{
    case ASSISTANCE_OVERDUE = 'assistance_overdue';
    case ISSUE_OVERDUE = 'issue_overdue';
    case OTHER = 'other';

    public function label(): string
    {
        return match ($this) {
            self::ASSISTANCE_OVERDUE => '帮扶逾期',
            self::ISSUE_OVERDUE => '议题逾期',
            self::OTHER => '其他',
        };
    }
}
