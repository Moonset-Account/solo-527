<?php

namespace App\Exceptions;

class InvalidStatusTransitionException extends BusinessException
{
    public function __construct(string $from, string $to)
    {
        parent::__construct("不允许从 {$from} 状态变更为 {$to} 状态", 422);
    }
}
