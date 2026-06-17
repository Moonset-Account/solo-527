<?php

namespace App\Enums;

enum IssueStatus: string
{
    case VOTING = 'voting';
    case ASSIGNED = 'assigned';
    case PROCESSING = 'processing';
    case RESOLVED = 'resolved';
    case CLOSED = 'closed';

    public function label(): string
    {
        return match ($this) {
            self::VOTING => '投票中',
            self::ASSIGNED => '已分派',
            self::PROCESSING => '处理中',
            self::RESOLVED => '已解决',
            self::CLOSED => '已关闭',
        };
    }
}
