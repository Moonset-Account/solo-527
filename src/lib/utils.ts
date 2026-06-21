import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, pattern = 'yyyy-MM-dd HH:mm') {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, pattern, { locale: zhCN });
}

export function formatRelativeTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
}

export function formatCurrency(amount: number | string) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatPercent(value: number, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function generateOrderNo() {
  const date = new Date();
  const timestamp = format(date, 'yyyyMMddHHmmss');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AP${timestamp}${random}`;
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    quality_check: 'bg-purple-100 text-purple-800 border-purple-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    passed: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getStatusText(status: string) {
  const texts: Record<string, string> = {
    pending: '待处理',
    in_progress: '进行中',
    quality_check: '质检中',
    completed: '已完成',
    cancelled: '已取消',
    passed: '合格',
    failed: '不合格',
    low: '低',
    medium: '中',
    high: '高',
    processing: '处理中',
    resolved: '已解决',
    part: '配件',
    service: '服务',
    in: '入库',
    out: '出库',
    adjust: '调整',
    check: '盘点',
    retail: '零售客户',
    enterprise: '企业客户',
    vip: 'VIP客户',
    admin: '店长',
    reception: '前台接待',
    technician: '维修技师',
    storekeeper: '库管员',
    accountant: '财务人员',
  };
  return texts[status] || status;
}

export function getRoleColor(role: string) {
  const colors: Record<string, string> = {
    admin: 'bg-indigo-100 text-indigo-800',
    reception: 'bg-cyan-100 text-cyan-800',
    technician: 'bg-orange-100 text-orange-800',
    storekeeper: 'bg-emerald-100 text-emerald-800',
    accountant: 'bg-amber-100 text-amber-800',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}
