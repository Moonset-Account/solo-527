<?php

namespace App\Enums;

enum NotificationType: string
{
    case BOOKING_CONFIRMED = 'booking_confirmed';
    case BOOKING_CANCELLED = 'booking_cancelled';
    case BOOKING_REMINDER = 'booking_reminder';
    case ATTENDANCE_SIGNED = 'attendance_signed';
    case LEAVE_SUBMITTED = 'leave_submitted';
    case LEAVE_APPROVED = 'leave_approved';
    case LEAVE_REJECTED = 'leave_rejected';
    case TRANSFER_SUBMITTED = 'transfer_submitted';
    case TRANSFER_APPROVED = 'transfer_approved';
    case TRANSFER_REJECTED = 'transfer_rejected';
    case REFUND_SUBMITTED = 'refund_submitted';
    case REFUND_APPROVED = 'refund_approved';
    case REFUND_REJECTED = 'refund_rejected';
    case COACH_SIGN_REVIEW = 'coach_sign_review';
    case PACKAGE_EXPIRING = 'package_expiring';
}
