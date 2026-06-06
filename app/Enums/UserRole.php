<?php

namespace App\Enums;

enum UserRole: string
{
    case ADMIN = 'admin';
    case SUPERVISOR = 'supervisor';
    case FRONTDESK = 'frontdesk';
    case COACH = 'coach';
    case MEMBER = 'member';
}
