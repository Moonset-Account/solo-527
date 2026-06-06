<?php

namespace App\Enums;

enum RefundStatus: string
{
    case PENDING = 'pending';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
    case WITHDRAWN = 'withdrawn';
    case COMPLETED = 'completed';
}
