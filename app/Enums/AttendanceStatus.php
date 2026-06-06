<?php

namespace App\Enums;

enum AttendanceStatus: string
{
    case PENDING = 'pending';
    case PRESENT = 'present';
    case ABSENT = 'absent';
    case COACH_SIGNED = 'coach_signed';
    case REVIEW_PENDING = 'review_pending';
    case REVIEW_APPROVED = 'review_approved';
    case REVIEW_REJECTED = 'review_rejected';
}
