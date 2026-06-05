import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined, pattern: string = 'yyyy-MM-dd') {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, pattern, { locale: zhCN });
}

export function formatDateTime(date: Date | string | null | undefined) {
  return formatDate(date, 'yyyy-MM-dd HH:mm');
}

export function formatRelativeTime(date: Date | string | null | undefined) {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
}

export function formatCurrency(amount: number | string | null | undefined) {
  if (amount === null || amount === undefined) return '-';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(num);
}

export function formatFileSize(bytes: number | null | undefined) {
  if (!bytes) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    TODO: 'bg-gray-100 text-gray-800',
    REVIEW: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    PENDING: 'bg-orange-100 text-orange-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    DECLINED: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: '草稿',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    TODO: '待办',
    REVIEW: '待审核',
    APPROVED: '已确认',
    PENDING: '待处理',
    CONFIRMED: '已确认',
    DECLINED: '已拒绝',
  };
  return labels[status] || status;
}

export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    LOW: '低',
    MEDIUM: '中',
    HIGH: '高',
    URGENT: '紧急',
  };
  return labels[priority] || priority;
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: '管理员',
    PLANNER: '策划师',
    SUPPLIER: '供应商',
    COUPLE: '新人',
  };
  return labels[role] || role;
}

export function getBudgetCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    VENUE: '场地',
    FLORISTRY: '花艺',
    PHOTOGRAPHY: '摄影',
    CATERING: '餐饮',
    DRESS: '礼服',
    MUSIC: '音乐',
    DECORATION: '装饰',
    OTHER: '其他',
  };
  return labels[category] || category;
}

export function getCategoryLabel(category: string): string {
  return getBudgetCategoryLabel(category);
}
