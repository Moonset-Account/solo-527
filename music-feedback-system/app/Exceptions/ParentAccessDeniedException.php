<?php

namespace App\Exceptions;

class ParentAccessDeniedException extends BusinessException
{
    public function __construct()
    {
        parent::__construct('您只能查看自己孩子的记录', 403);
    }
}
