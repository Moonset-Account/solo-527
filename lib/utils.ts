import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    return format(new Date(dateStr), 'yyyy-MM-dd');
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    return format(new Date(dateStr), 'yyyy-MM-dd HH:mm', { locale: zhCN });
  } catch {
    return dateStr;
  }
}

export function daysBetween(from: string, to: string): number {
  const d1 = new Date(from).getTime();
  const d2 = new Date(to).getTime();
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

export function daysFromToday(dateStr: string): number {
  return daysBetween(format(new Date(), 'yyyy-MM-dd'), dateStr);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: '待启动', className: 'bg-zinc-100 text-zinc-600' },
  in_progress: { label: '进行中', className: 'bg-brand-50 text-brand-700' },
  completed: { label: '已完成', className: 'bg-green-50 text-green-700' },
  suspended: { label: '已暂停', className: 'bg-zinc-100 text-zinc-500' },
  not_started: { label: '未开始', className: 'bg-zinc-100 text-zinc-500' },
  delayed: { label: '已延期', className: 'bg-danger-50 text-danger-600' },
  draft: { label: '草稿', className: 'bg-zinc-100 text-zinc-500' },
  pending_confirm: { label: '待确认', className: 'bg-warn-50 text-warn-600' },
  confirmed: { label: '已确认', className: 'bg-green-50 text-green-700' },
  rejected: { label: '已驳回', className: 'bg-danger-50 text-danger-600' },
  rectifying: { label: '整改中', className: 'bg-warn-50 text-warn-600' },
  processing: { label: '处理中', className: 'bg-brand-50 text-brand-700' },
  closed: { label: '已关闭', className: 'bg-zinc-100 text-zinc-500' },
  low: { label: '低', className: 'bg-zinc-100 text-zinc-600' },
  medium: { label: '中', className: 'bg-warn-50 text-warn-600' },
  high: { label: '高', className: 'bg-danger-50 text-danger-600' },
  admin: { label: '管理员', className: 'bg-brand-50 text-brand-700' },
  project_manager: { label: '项目经理', className: 'bg-blue-50 text-blue-700' },
  customer: { label: '客户', className: 'bg-purple-50 text-purple-700' },
};

export function getStatusLabel(status: string): string {
  return statusLabels[status]?.label ?? status;
}

export function getStatusClass(status: string): string {
  return statusLabels[status]?.className ?? 'bg-zinc-100 text-zinc-600';
}
