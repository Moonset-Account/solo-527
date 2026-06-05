<?php

namespace App\Exceptions;

class InsufficientPermissionException extends BusinessException
{
    public function __construct()
    {
        parent::__construct('权限不足', 403);
    }
}
