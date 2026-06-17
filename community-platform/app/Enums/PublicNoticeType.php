<?php

namespace App\Enums;

enum PublicNoticeType: string
{
    case GRID_EVENT = 'grid_event';
    case ASSISTANCE = 'assistance';
    case ISSUE = 'issue';

    public function label(): string
    {
        return match ($this) {
            self::GRID_EVENT => '网格事件',
            self::ASSISTANCE => '帮扶',
            self::ISSUE => '议题',
        };
    }
}
