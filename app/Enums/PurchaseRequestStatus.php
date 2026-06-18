<?php

namespace App\Enums;

enum PurchaseRequestStatus: string
{
    case DRAFT = 'draft';
    case SUBMITTED = 'submitted';
    case PENDING_APPROVAL = 'pending_approval';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
    case CANCELLED = 'cancelled';
    case IN_QUOTATION = 'in_quotation';
    case QUOTATION_COMPLETED = 'quotation_completed';
    case PURCHASING = 'purchasing';
    case DELIVERED = 'delivered';
    case COMPLETED = 'completed';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => '草稿',
            self::SUBMITTED => '已提交',
            self::PENDING_APPROVAL => '待审批',
            self::APPROVED => '已批准',
            self::REJECTED => '已拒绝',
            self::CANCELLED => '已取消',
            self::IN_QUOTATION => '报价中',
            self::QUOTATION_COMPLETED => '报价完成',
            self::PURCHASING => '采购中',
            self::DELIVERED => '已到货',
            self::COMPLETED => '已完成',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::DRAFT => 'gray',
            self::SUBMITTED => 'blue',
            self::PENDING_APPROVAL => 'yellow',
            self::APPROVED => 'green',
            self::REJECTED => 'red',
            self::CANCELLED => 'gray',
            self::IN_QUOTATION => 'purple',
            self::QUOTATION_COMPLETED => 'indigo',
            self::PURCHASING => 'orange',
            self::DELIVERED => 'teal',
            self::COMPLETED => 'green',
        };
    }
}
