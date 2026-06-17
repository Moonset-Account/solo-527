<?php

namespace App\Enums;

enum UserRole: string
{
    case ADMIN = 'admin';
    case DEPARTMENT = 'department';
    case REPRESENTATIVE = 'representative';
    case RESIDENT = 'resident';

    public function label(): string
    {
        return match ($this) {
            self::ADMIN => '管理员',
            self::DEPARTMENT => '部门人员',
            self::REPRESENTATIVE => '居民代表',
            self::RESIDENT => '普通居民',
        };
    }
}
