import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string, pattern: string = 'yyyy-MM-dd') {
  try {
    return format(parseISO(dateStr), pattern, { locale: zhCN });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string) {
  return formatDate(dateStr, 'yyyy-MM-dd HH:mm');
}

export function formatRelativeTime(dateStr: string) {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: zhCN });
  } catch {
    return dateStr;
  }
}

export function formatCurrency(amount?: number) {
  if (!amount) return '¥0';
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function maskPhone(phone: string) {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

export function getInitials(name: string) {
  if (!name) return '?';
  return name.slice(0, 1);
}

export function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function roleLabel(role: string) {
  const map: Record<string, string> = {
    super_admin: '超级管理员',
    sales_manager: '销售经理',
    sales_consultant: '销售顾问',
    analyst: '数据分析员',
  };
  return map[role] || role;
}

export function methodLabel(method: string) {
  const map: Record<string, string> = {
    phone: '电话',
    wechat: '微信',
    visit: '上门拜访',
    other: '其他',
  };
  return map[method] || method;
}

export function changeTypeLabel(type: string) {
  const map: Record<string, string> = {
    create: '创建线索',
    update: '信息更新',
    stage_change: '阶段变更',
    assign: '分配/转派',
    recycle: '回收公海',
  };
  return map[type] || type;
}

export function changeTypeColor(type: string) {
  const map: Record<string, string> = {
    create: 'bg-blue-100 text-blue-700 border-blue-200',
    update: 'bg-gray-100 text-gray-700 border-gray-200',
    stage_change: 'bg-purple-100 text-purple-700 border-purple-200',
    assign: 'bg-amber-100 text-amber-700 border-amber-200',
    recycle: 'bg-red-100 text-red-700 border-red-200',
  };
  return map[type] || 'bg-gray-100 text-gray-700 border-gray-200';
}
