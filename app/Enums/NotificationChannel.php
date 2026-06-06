<?php

namespace App\Enums;

enum NotificationChannel: string
{
    case SMS = 'sms';
    case EMAIL = 'email';
    case WECHAT = 'wechat';
    case APP_PUSH = 'app_push';
    case SYSTEM = 'system';
}
