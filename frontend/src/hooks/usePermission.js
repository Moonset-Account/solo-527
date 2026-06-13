import { useMemo } from 'react';
import useAuthStore from '../store/authStore.js';

const ROLE_HIERARCHY = {
  ADMIN: ['ADMIN', 'FINANCE_MANAGER', 'FINANCE_STAFF', 'CUSTOMER'],
  FINANCE_MANAGER: ['FINANCE_MANAGER', 'FINANCE_STAFF', 'CUSTOMER'],
  FINANCE_STAFF: ['FINANCE_STAFF', 'CUSTOMER'],
  CUSTOMER: ['CUSTOMER'],
};

const usePermission = () => {
  const { user } = useAuthStore();

  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role;
  };

  const hasAnyRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const hasPermission = (requiredRole) => {
    if (!user) return false;
    const allowedRoles = ROLE_HIERARCHY[user.role] || [];
    return allowedRoles.includes(requiredRole);
  };

  const isAdmin = useMemo(() => user?.role === 'ADMIN', [user]);
  const isFinanceManager = useMemo(() => ['ADMIN', 'FINANCE_MANAGER'].includes(user?.role), [user]);
  const isFinanceStaff = useMemo(() => ['ADMIN', 'FINANCE_MANAGER', 'FINANCE_STAFF'].includes(user?.role), [user]);
  const isCustomer = useMemo(() => user?.role === 'CUSTOMER', [user]);

  const canViewBills = true;
  const canCreateBill = isFinanceStaff;
  const canEditBill = isFinanceStaff;
  const canDeleteBill = isFinanceManager;

  const canViewTransactions = isFinanceStaff;
  const canMatchTransaction = isFinanceStaff;
  const canUnmatchTransaction = isFinanceManager;

  const canViewCollections = isFinanceStaff;
  const canCreateCollection = isFinanceStaff;

  const canViewRefunds = true;
  const canCreateRefund = isFinanceStaff;
  const canApproveRefund = isFinanceManager;

  const canViewWriteOffs = isFinanceStaff;
  const canCreateWriteOff = isFinanceStaff;
  const canApproveWriteOff = isFinanceManager;

  const canViewStatistics = isFinanceStaff;
  const canViewCustomers = isFinanceStaff;
  const canManageCustomers = isFinanceManager;

  const canExport = isFinanceStaff;

  return {
    user,
    hasRole,
    hasAnyRole,
    hasPermission,
    isAdmin,
    isFinanceManager,
    isFinanceStaff,
    isCustomer,
    canViewBills,
    canCreateBill,
    canEditBill,
    canDeleteBill,
    canViewTransactions,
    canMatchTransaction,
    canUnmatchTransaction,
    canViewCollections,
    canCreateCollection,
    canViewRefunds,
    canCreateRefund,
    canApproveRefund,
    canViewWriteOffs,
    canCreateWriteOff,
    canApproveWriteOff,
    canViewStatistics,
    canViewCustomers,
    canManageCustomers,
    canExport,
  };
};

export default usePermission;
