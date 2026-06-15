import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function daysUntil(date: Date | string | null | undefined): number {
  if (!date) return Infinity;
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function countdownText(date: Date | string | null | undefined): string {
  const days = daysUntil(date);
  if (days === Infinity) return '无截止';
  if (days < 0) return `已逾期 ${Math.abs(days)} 天`;
  if (days === 0) return '今天截止';
  if (days === 1) return '明天截止';
  return `还剩 ${days} 天`;
}

export const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  PENDING_CLAIM: { label: '待认领', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  IN_PROGRESS: { label: '进行中', className: 'bg-blue-50 text-primary border-primary/20' },
  DELAYED: { label: '已延期', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  COMPLETED: { label: '已完成', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED: { label: '已取消', className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

export const PRIORITY_LABEL: Record<string, { label: string; dot: string; bar: string }> = {
  LOW: { label: '低', dot: 'bg-slate-400', bar: 'bg-slate-300' },
  MEDIUM: { label: '中', dot: 'bg-sky-500', bar: 'bg-sky-400' },
  HIGH: { label: '高', dot: 'bg-orange-500', bar: 'bg-orange-400' },
  URGENT: { label: '紧急', dot: 'bg-red-500', bar: 'bg-red-500' },
};

export const ROLE_LABEL: Record<string, { label: string; className: string }> = {
  ADMIN: { label: '系统管理员', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  ADMIN_LEAD: { label: '行政负责人', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  USER: { label: '普通用户', className: 'bg-slate-50 text-slate-600 border-slate-200' },
};

export const ACTION_LABEL: Record<string, { label: string; className: string }> = {
  TASK_CREATED: { label: '创建事项', className: 'bg-blue-50 text-blue-700' },
  TASK_CLAIMED: { label: '认领事项', className: 'bg-teal-50 text-teal-700' },
  TASK_COMPLETED: { label: '完成事项', className: 'bg-emerald-50 text-emerald-700' },
  TASK_CANCELLED: { label: '取消事项', className: 'bg-gray-50 text-gray-600' },
  PROGRESS_UPDATED: { label: '更新进度', className: 'bg-sky-50 text-sky-700' },
  DELAY_RECORDED: { label: '录入延期', className: 'bg-amber-50 text-amber-700' },
  ASSIGNEE_CHANGED: { label: '变更责任人', className: 'bg-rose-50 text-rose-700 font-semibold' },
  STATUS_CHANGED: { label: '状态变更', className: 'bg-violet-50 text-violet-700' },
  REMINDER_SENT: { label: '发送催办', className: 'bg-orange-50 text-orange-700' },
  REMINDER_SCHEDULED: { label: '设置提醒', className: 'bg-yellow-50 text-yellow-700' },
  USER_CREATED: { label: '创建用户', className: 'bg-indigo-50 text-indigo-700' },
  USER_ROLE_CHANGED: { label: '角色变更', className: 'bg-fuchsia-50 text-fuchsia-700' },
};
