<?php

namespace App\Enums;

enum PermissionName: string
{
    case VIEW_DASHBOARD = 'view_dashboard';

    case VIEW_SUPPLIES = 'view_supplies';
    case CREATE_SUPPLIES = 'create_supplies';
    case EDIT_SUPPLIES = 'edit_supplies';
    case DELETE_SUPPLIES = 'delete_supplies';
    case MANAGE_SUPPLY_CATEGORIES = 'manage_supply_categories';

    case VIEW_SUPPLIERS = 'view_suppliers';
    case CREATE_SUPPLIERS = 'create_suppliers';
    case EDIT_SUPPLIERS = 'edit_suppliers';
    case DELETE_SUPPLIERS = 'delete_suppliers';
    case MANAGE_SUPPLIER_RISK = 'manage_supplier_risk';
    case VIEW_SUPPLIER_RISK_LOGS = 'view_supplier_risk_logs';

    case VIEW_PURCHASE_REQUESTS = 'view_purchase_requests';
    case CREATE_PURCHASE_REQUESTS = 'create_purchase_requests';
    case EDIT_PURCHASE_REQUESTS = 'edit_purchase_requests';
    case DELETE_PURCHASE_REQUESTS = 'delete_purchase_requests';
    case SUBMIT_PURCHASE_REQUESTS = 'submit_purchase_requests';
    case CANCEL_PURCHASE_REQUESTS = 'cancel_purchase_requests';
    case APPROVE_PURCHASE_REQUESTS = 'approve_purchase_requests';
    case REJECT_PURCHASE_REQUESTS = 'reject_purchase_requests';
    case VIEW_ALL_PURCHASE_REQUESTS = 'view_all_purchase_requests';

    case VIEW_APPROVAL_FLOWS = 'view_approval_flows';
    case CREATE_APPROVAL_FLOWS = 'create_approval_flows';
    case EDIT_APPROVAL_FLOWS = 'edit_approval_flows';
    case DELETE_APPROVAL_FLOWS = 'delete_approval_flows';
    case MANAGE_APPROVAL_STEPS = 'manage_approval_steps';

    case VIEW_QUOTATIONS = 'view_quotations';
    case CREATE_QUOTATIONS = 'create_quotations';
    case EDIT_QUOTATIONS = 'edit_quotations';
    case DELETE_QUOTATIONS = 'delete_quotations';
    case SUBMIT_QUOTATIONS = 'submit_quotations';
    case REVIEW_QUOTATIONS = 'review_quotations';
    case APPROVE_QUOTATIONS = 'approve_quotations';
    case REJECT_QUOTATIONS = 'reject_quotations';
    case SELECT_QUOTATIONS = 'select_quotations';
    case VIEW_ALL_QUOTATIONS = 'view_all_quotations';

    case VIEW_FINANCIAL_REVIEWS = 'view_financial_reviews';
    case CREATE_FINANCIAL_REVIEWS = 'create_financial_reviews';
    case REVIEW_FINANCIALLY = 'review_financially';
    case APPROVE_FINANCIALLY = 'approve_financially';
    case REJECT_FINANCIALLY = 'reject_financially';

    case VIEW_DELIVERIES = 'view_deliveries';
    case CREATE_DELIVERIES = 'create_deliveries';
    case CONFIRM_DELIVERIES = 'confirm_deliveries';
    case MANAGE_DELIVERY_DISCREPANCIES = 'manage_delivery_discrepancies';

    case VIEW_BATCH_LOGS = 'view_batch_logs';
    case RETRY_BATCH_JOBS = 'retry_batch_jobs';
    case MANAGE_BATCH_PROCESSING = 'manage_batch_processing';

    case VIEW_SYSTEM_CONFIGS = 'view_system_configs';
    case EDIT_SYSTEM_CONFIGS = 'edit_system_configs';

    case VIEW_USERS = 'view_users';
    case CREATE_USERS = 'create_users';
    case EDIT_USERS = 'edit_users';
    case DELETE_USERS = 'delete_users';
    case MANAGE_ROLES = 'manage_roles';
    case MANAGE_PERMISSIONS = 'manage_permissions';

    case VIEW_REPORTS = 'view_reports';
    case EXPORT_REPORTS = 'export_reports';

    case VIEW_NOTIFICATIONS = 'view_notifications';
    case MANAGE_NOTIFICATIONS = 'manage_notifications';

    public function label(): string
    {
        return match ($this) {
            self::VIEW_DASHBOARD => '查看仪表盘',
            self::VIEW_SUPPLIES => '查看物资',
            self::CREATE_SUPPLIES => '创建物资',
            self::EDIT_SUPPLIES => '编辑物资',
            self::DELETE_SUPPLIES => '删除物资',
            self::MANAGE_SUPPLY_CATEGORIES => '管理物资分类',
            self::VIEW_SUPPLIERS => '查看供应商',
            self::CREATE_SUPPLIERS => '创建供应商',
            self::EDIT_SUPPLIERS => '编辑供应商',
            self::DELETE_SUPPLIERS => '删除供应商',
            self::MANAGE_SUPPLIER_RISK => '管理供应商风险',
            self::VIEW_SUPPLIER_RISK_LOGS => '查看供应商风险日志',
            self::VIEW_PURCHASE_REQUESTS => '查看采购申请',
            self::CREATE_PURCHASE_REQUESTS => '创建采购申请',
            self::EDIT_PURCHASE_REQUESTS => '编辑采购申请',
            self::DELETE_PURCHASE_REQUESTS => '删除采购申请',
            self::SUBMIT_PURCHASE_REQUESTS => '提交采购申请',
            self::CANCEL_PURCHASE_REQUESTS => '取消采购申请',
            self::APPROVE_PURCHASE_REQUESTS => '审批采购申请',
            self::REJECT_PURCHASE_REQUESTS => '拒绝采购申请',
            self::VIEW_ALL_PURCHASE_REQUESTS => '查看所有采购申请',
            self::VIEW_APPROVAL_FLOWS => '查看审批流程',
            self::CREATE_APPROVAL_FLOWS => '创建审批流程',
            self::EDIT_APPROVAL_FLOWS => '编辑审批流程',
            self::DELETE_APPROVAL_FLOWS => '删除审批流程',
            self::MANAGE_APPROVAL_STEPS => '管理审批步骤',
            self::VIEW_QUOTATIONS => '查看报价',
            self::CREATE_QUOTATIONS => '创建报价',
            self::EDIT_QUOTATIONS => '编辑报价',
            self::DELETE_QUOTATIONS => '删除报价',
            self::SUBMIT_QUOTATIONS => '提交报价',
            self::REVIEW_QUOTATIONS => '审核报价',
            self::APPROVE_QUOTATIONS => '批准报价',
            self::REJECT_QUOTATIONS => '拒绝报价',
            self::SELECT_QUOTATIONS => '选择中标报价',
            self::VIEW_ALL_QUOTATIONS => '查看所有报价',
            self::VIEW_FINANCIAL_REVIEWS => '查看财务审核',
            self::CREATE_FINANCIAL_REVIEWS => '创建财务审核',
            self::REVIEW_FINANCIALLY => '财务审核',
            self::APPROVE_FINANCIALLY => '财务批准',
            self::REJECT_FINANCIALLY => '财务拒绝',
            self::VIEW_DELIVERIES => '查看发货',
            self::CREATE_DELIVERIES => '创建发货',
            self::CONFIRM_DELIVERIES => '确认收货',
            self::MANAGE_DELIVERY_DISCREPANCIES => '管理发货差异',
            self::VIEW_BATCH_LOGS => '查看批量日志',
            self::RETRY_BATCH_JOBS => '重试批量任务',
            self::MANAGE_BATCH_PROCESSING => '管理批量处理',
            self::VIEW_SYSTEM_CONFIGS => '查看系统配置',
            self::EDIT_SYSTEM_CONFIGS => '编辑系统配置',
            self::VIEW_USERS => '查看用户',
            self::CREATE_USERS => '创建用户',
            self::EDIT_USERS => '编辑用户',
            self::DELETE_USERS => '删除用户',
            self::MANAGE_ROLES => '管理角色',
            self::MANAGE_PERMISSIONS => '管理权限',
            self::VIEW_REPORTS => '查看报表',
            self::EXPORT_REPORTS => '导出报表',
            self::VIEW_NOTIFICATIONS => '查看通知',
            self::MANAGE_NOTIFICATIONS => '管理通知',
        };
    }
}
