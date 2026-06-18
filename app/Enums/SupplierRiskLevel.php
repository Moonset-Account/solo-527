<?php

namespace App\Enums;

enum SupplierRiskLevel: string
{
    case LOW = 'low';
    case MEDIUM = 'medium';
    case HIGH = 'high';
    case CRITICAL = 'critical';
    case BLACKLISTED = 'blacklisted';

    public function label(): string
    {
        return match ($this) {
            self::LOW => '低风险',
            self::MEDIUM => '中风险',
            self::HIGH => '高风险',
            self::CRITICAL => '严重风险',
            self::BLACKLISTED => '黑名单',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::LOW => 'green',
            self::MEDIUM => 'yellow',
            self::HIGH => 'orange',
            self::CRITICAL => 'red',
            self::BLACKLISTED => 'gray',
        };
    }

    public function score(): int
    {
        return match ($this) {
            self::LOW => 1,
            self::MEDIUM => 2,
            self::HIGH => 3,
            self::CRITICAL => 4,
            self::BLACKLISTED => 5,
        };
    }
}
