import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type {
  UserRole,
  WorkOrderStatus,
  NodeStatus,
  OverallResult,
  ChangeStatus,
  CallbackStatus,
  TurnoverType,
} from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | Date, withTime = true) {
  const d = typeof input === 'string' ? new Date(input) : input;
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  if (!withTime) return date;
  return `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(value);
}

export const roleLabel: Record<UserRole, string> = {
  store_manager: '门店店长',
  warehouse: '仓库管理员',
  inspector: '质检员',
  team_lead: '班组长',
  reception: '前台接待',
};

export const workOrderStatusLabel: Record<WorkOrderStatus, string> = {
  pending: '待派工',
  assigned: '已派工',
  in_progress: '维修中',
  quality_check: '待质检',
  completed: '已完成',
  cancelled: '已取消',
};

export const workOrderStatusColor: Record<WorkOrderStatus, string> = {
  pending: 'bg-slate-100 text-slate-700',
  assigned: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  quality_check: 'bg-purple-50 text-purple-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
};

export const nodeStatusLabel: Record<NodeStatus, string> = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成',
};

export const nodeStatusColor: Record<NodeStatus, string> = {
  pending: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
};

export const overallResultLabel: Record<OverallResult, string> = {
  pass: '通过',
  fail: '不通过',
  rework: '需返工',
};

export const overallResultColor: Record<OverallResult, string> = {
  pass: 'bg-emerald-50 text-emerald-700',
  fail: 'bg-red-50 text-red-700',
  rework: 'bg-amber-50 text-amber-700',
};

export const changeStatusLabel: Record<ChangeStatus, string> = {
  open: '待处理',
  processing: '处理中',
  closed: '已关闭',
};

export const changeStatusColor: Record<ChangeStatus, string> = {
  open: 'bg-red-50 text-red-700',
  processing: 'bg-amber-50 text-amber-700',
  closed: 'bg-slate-100 text-slate-600',
};

export const callbackStatusLabel: Record<CallbackStatus, string> = {
  pending: '待处理',
  success: '成功',
  failed: '失败',
};

export const callbackStatusColor: Record<CallbackStatus, string> = {
  pending: 'bg-slate-100 text-slate-600',
  success: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-red-50 text-red-700',
};

export const turnoverTypeLabel: Record<TurnoverType, string> = {
  in: '入库',
  out: '出库',
  transfer: '调拨',
};

export const turnoverTypeColor: Record<TurnoverType, string> = {
  in: 'bg-emerald-50 text-emerald-700',
  out: 'bg-brand-50 text-brand-700',
  transfer: 'bg-purple-50 text-purple-700',
};

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function roleCanAccess(role: UserRole, allowed: UserRole[] | 'all') {
  if (allowed === 'all') return true;
  if (role === 'store_manager') return true;
  return allowed.includes(role);
}
