<?php

namespace App\Enums;

enum RoleName: string
{
    case SUPER_ADMIN = 'super_admin';
    case ADMIN = 'admin';
    case PROCUREMENT_MANAGER = 'procurement_manager';
    case PROCUREMENT_STAFF = 'procurement_staff';
    case DEPARTMENT_HEAD = 'department_head';
    case FINANCIAL_MANAGER = 'financial_manager';
    case FINANCIAL_STAFF = 'financial_staff';
    case WAREHOUSE_MANAGER = 'warehouse_manager';
    case WAREHOUSE_STAFF = 'warehouse_staff';
    case SUPPLIER = 'supplier';
    case EMPLOYEE = 'employee';
    case AUDITOR = 'auditor';

    public function label(): string
    {
        return match ($this) {
            self::SUPER_ADMIN => '超级管理员',
            self::ADMIN => '系统管理员',
            self::PROCUREMENT_MANAGER => '采购经理',
            self::PROCUREMENT_STAFF => '采购专员',
            self::DEPARTMENT_HEAD => '部门主管',
            self::FINANCIAL_MANAGER => '财务经理',
            self::FINANCIAL_STAFF => '财务专员',
            self::WAREHOUSE_MANAGER => '仓库经理',
            self::WAREHOUSE_STAFF => '仓库管理员',
            self::SUPPLIER => '供应商',
            self::EMPLOYEE => '普通员工',
            self::AUDITOR => '审计员',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::SUPER_ADMIN => '拥有系统所有权限',
            self::ADMIN => '系统管理与配置',
            self::PROCUREMENT_MANAGER => '采购部门管理与审批',
            self::PROCUREMENT_STAFF => '采购申请与报价处理',
            self::DEPARTMENT_HEAD => '部门采购申请审批',
            self::FINANCIAL_MANAGER => '财务审核与管理',
            self::FINANCIAL_STAFF => '财务数据处理',
            self::WAREHOUSE_MANAGER => '仓库管理与审批',
            self::WAREHOUSE_STAFF => '库存管理与收货确认',
            self::SUPPLIER => '供应商报价与订单管理',
            self::EMPLOYEE => '提交采购申请',
            self::AUDITOR => '审计与数据查看',
        };
    }
}
