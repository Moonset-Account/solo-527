<?php

namespace App\Enums;

enum ApprovalStatus: string
{
    case PENDING = 'pending';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
    case SKIPPED = 'skipped';
    case WITHDRAWN = 'withdrawn';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => '待审批',
            self::APPROVED => '已通过',
            self::REJECTED => '已拒绝',
            self::SKIPPED => '已跳过',
            self::WITHDRAWN => '已撤回',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::PENDING => 'yellow',
            self::APPROVED => 'green',
            self::REJECTED => 'red',
            self::SKIPPED => 'gray',
            self::WITHDRAWN => 'orange',
        };
    }
}
