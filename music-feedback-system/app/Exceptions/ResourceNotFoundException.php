<?php

namespace App\Exceptions;

class ResourceNotFoundException extends BusinessException
{
    public function __construct()
    {
        parent::__construct('资源不存在', 404);
    }
}
