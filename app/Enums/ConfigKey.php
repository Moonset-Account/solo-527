<?php

namespace App\Enums;

enum ConfigKey: string
{
    case APPROVAL_ENABLED = 'approval_enabled';
    case QUOTATION_EXPIRY_DAYS = 'quotation_expiry_days';
    case QUOTATION_EXPIRY_REMINDER_DAYS = 'quotation_expiry_reminder_days';
    case APPROVAL_TIMEOUT_HOURS = 'approval_timeout_hours';
    case DELIVERY_CONFIRMATION_ENABLED = 'delivery_confirmation_enabled';
    case SPEC_ATTACHMENT_REQUIRED = 'spec_attachment_required';
    case PRICE_HISTORY_TRACK_ENABLED = 'price_history_track_enabled';
    case SUPPLIER_RISK_ASSESSMENT_ENABLED = 'supplier_risk_assessment_enabled';
    case PAYMENT_GATEWAY_ENABLED = 'payment_gateway_enabled';
    case MESSAGE_CHANNEL_ENABLED = 'message_channel_enabled';
    case BATCH_RETRY_MAX_ATTEMPTS = 'batch_retry_max_attempts';
    case BATCH_PROCESSING_LIMIT = 'batch_processing_limit';
    case MAX_RETRY_ATTEMPTS = 'max_retry_attempts';
    case RETRY_INTERVAL_MINUTES = 'retry_interval_minutes';
    case FINANCIAL_REVIEW_REQUIRED = 'financial_review_required';
    case DELIVERY_DISCREPANCY_SYNC_ENABLED = 'delivery_discrepancy_sync_enabled';
    case FINANCIAL_REVIEW_THRESHOLD = 'financial_review_threshold';
    case SUPPLIER_RISK_AUTO_DAYS = 'supplier_risk_auto_days';
    case LOW_STOCK_THRESHOLD = 'low_stock_threshold';
    case NOTIFICATION_EMAIL_ENABLED = 'notification_email_enabled';
    case NOTIFICATION_SMS_ENABLED = 'notification_sms_enabled';
    case SYSTEM_MAINTENANCE_MODE = 'system_maintenance_mode';
    case DEFAULT_APPROVAL_FLOW = 'default_approval_flow';

    public function label(): string
    {
        return match ($this) {
            self::APPROVAL_ENABLED => '启用审批流',
            self::QUOTATION_EXPIRY_DAYS => '报价有效期（天）',
            self::QUOTATION_EXPIRY_REMINDER_DAYS => '报价过期提醒提前（天）',
            self::APPROVAL_TIMEOUT_HOURS => '审批超时时间（小时）',
            self::DELIVERY_CONFIRMATION_ENABLED => '启用到货确认',
            self::SPEC_ATTACHMENT_REQUIRED => '规格附件必填',
            self::PRICE_HISTORY_TRACK_ENABLED => '启用历史价格追踪',
            self::SUPPLIER_RISK_ASSESSMENT_ENABLED => '启用供应商风险评估',
            self::PAYMENT_GATEWAY_ENABLED => '启用支付通道',
            self::MESSAGE_CHANNEL_ENABLED => '启用消息通道',
            self::BATCH_RETRY_MAX_ATTEMPTS => '批次最大重试次数',
            self::BATCH_PROCESSING_LIMIT => '批量处理限制',
            self::MAX_RETRY_ATTEMPTS => '最大重试次数',
            self::RETRY_INTERVAL_MINUTES => '重试间隔（分钟）',
            self::FINANCIAL_REVIEW_REQUIRED => '需要财务复核',
            self::DELIVERY_DISCREPANCY_SYNC_ENABLED => '交付差异看板同步',
            self::FINANCIAL_REVIEW_THRESHOLD => '财务审核阈值（元）',
            self::SUPPLIER_RISK_AUTO_DAYS => '供应商风险自动评估天数',
            self::LOW_STOCK_THRESHOLD => '低库存预警阈值',
            self::NOTIFICATION_EMAIL_ENABLED => '邮件通知开关',
            self::NOTIFICATION_SMS_ENABLED => '短信通知开关',
            self::SYSTEM_MAINTENANCE_MODE => '系统维护模式',
            self::DEFAULT_APPROVAL_FLOW => '默认审批流程',
        };
    }

    public function type(): string
    {
        return match ($this) {
            self::QUOTATION_EXPIRY_DAYS,
            self::QUOTATION_EXPIRY_REMINDER_DAYS,
            self::APPROVAL_TIMEOUT_HOURS,
            self::BATCH_RETRY_MAX_ATTEMPTS,
            self::BATCH_PROCESSING_LIMIT,
            self::MAX_RETRY_ATTEMPTS,
            self::RETRY_INTERVAL_MINUTES,
            self::SUPPLIER_RISK_AUTO_DAYS,
            self::LOW_STOCK_THRESHOLD => 'integer',
            self::FINANCIAL_REVIEW_THRESHOLD => 'decimal',
            self::APPROVAL_ENABLED,
            self::DELIVERY_CONFIRMATION_ENABLED,
            self::SPEC_ATTACHMENT_REQUIRED,
            self::PRICE_HISTORY_TRACK_ENABLED,
            self::SUPPLIER_RISK_ASSESSMENT_ENABLED,
            self::PAYMENT_GATEWAY_ENABLED,
            self::MESSAGE_CHANNEL_ENABLED,
            self::FINANCIAL_REVIEW_REQUIRED,
            self::DELIVERY_DISCREPANCY_SYNC_ENABLED,
            self::NOTIFICATION_EMAIL_ENABLED,
            self::NOTIFICATION_SMS_ENABLED,
            self::SYSTEM_MAINTENANCE_MODE => 'boolean',
            self::DEFAULT_APPROVAL_FLOW => 'string',
        };
    }

    public function defaultValue(): mixed
    {
        return match ($this) {
            self::APPROVAL_ENABLED => true,
            self::QUOTATION_EXPIRY_DAYS => 30,
            self::QUOTATION_EXPIRY_REMINDER_DAYS => 7,
            self::APPROVAL_TIMEOUT_HOURS => 48,
            self::DELIVERY_CONFIRMATION_ENABLED => true,
            self::SPEC_ATTACHMENT_REQUIRED => false,
            self::PRICE_HISTORY_TRACK_ENABLED => true,
            self::SUPPLIER_RISK_ASSESSMENT_ENABLED => true,
            self::PAYMENT_GATEWAY_ENABLED => false,
            self::MESSAGE_CHANNEL_ENABLED => false,
            self::BATCH_RETRY_MAX_ATTEMPTS => 3,
            self::BATCH_PROCESSING_LIMIT => 100,
            self::MAX_RETRY_ATTEMPTS => 3,
            self::RETRY_INTERVAL_MINUTES => 5,
            self::FINANCIAL_REVIEW_REQUIRED => true,
            self::DELIVERY_DISCREPANCY_SYNC_ENABLED => true,
            self::FINANCIAL_REVIEW_THRESHOLD => 50000.00,
            self::SUPPLIER_RISK_AUTO_DAYS => 90,
            self::LOW_STOCK_THRESHOLD => 10,
            self::NOTIFICATION_EMAIL_ENABLED => true,
            self::NOTIFICATION_SMS_ENABLED => false,
            self::SYSTEM_MAINTENANCE_MODE => false,
            self::DEFAULT_APPROVAL_FLOW => null,
        };
    }

    public function category(): string
    {
        return match ($this) {
            self::APPROVAL_ENABLED,
            self::APPROVAL_TIMEOUT_HOURS,
            self::DEFAULT_APPROVAL_FLOW => 'approval',
            self::QUOTATION_EXPIRY_DAYS,
            self::QUOTATION_EXPIRY_REMINDER_DAYS => 'quotation',
            self::DELIVERY_CONFIRMATION_ENABLED,
            self::DELIVERY_DISCREPANCY_SYNC_ENABLED => 'delivery',
            self::SPEC_ATTACHMENT_REQUIRED,
            self::PRICE_HISTORY_TRACK_ENABLED,
            self::LOW_STOCK_THRESHOLD => 'supply',
            self::SUPPLIER_RISK_ASSESSMENT_ENABLED,
            self::SUPPLIER_RISK_AUTO_DAYS => 'supplier',
            self::PAYMENT_GATEWAY_ENABLED,
            self::MESSAGE_CHANNEL_ENABLED => 'integration',
            self::BATCH_RETRY_MAX_ATTEMPTS,
            self::BATCH_PROCESSING_LIMIT,
            self::MAX_RETRY_ATTEMPTS,
            self::RETRY_INTERVAL_MINUTES,
            self::SYSTEM_MAINTENANCE_MODE => 'system',
            self::FINANCIAL_REVIEW_REQUIRED,
            self::FINANCIAL_REVIEW_THRESHOLD => 'financial',
            self::NOTIFICATION_EMAIL_ENABLED,
            self::NOTIFICATION_SMS_ENABLED => 'notification',
        };
    }
}
