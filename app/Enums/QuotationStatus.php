<?php

namespace App\Enums;

enum QuotationStatus: string
{
    case DRAFT = 'draft';
    case SUBMITTED = 'submitted';
    case UNDER_REVIEW = 'under_review';
    case FINANCIAL_REVIEW = 'financial_review';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
    case CANCELLED = 'cancelled';
    case EXPIRED = 'expired';
    case SELECTED = 'selected';
    case ORDERED = 'ordered';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => '草稿',
            self::SUBMITTED => '已提交',
            self::UNDER_REVIEW => '审核中',
            self::FINANCIAL_REVIEW => '财务审核',
            self::APPROVED => '已批准',
            self::REJECTED => '已拒绝',
            self::CANCELLED => '已取消',
            self::EXPIRED => '已过期',
            self::SELECTED => '已中标',
            self::ORDERED => '已下单',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::DRAFT => 'gray',
            self::SUBMITTED => 'blue',
            self::UNDER_REVIEW => 'yellow',
            self::FINANCIAL_REVIEW => 'purple',
            self::APPROVED => 'green',
            self::REJECTED => 'red',
            self::CANCELLED => 'gray',
            self::EXPIRED => 'orange',
            self::SELECTED => 'indigo',
            self::ORDERED => 'teal',
        };
    }
}
