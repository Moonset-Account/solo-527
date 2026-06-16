import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null) {
  if (!date) return '-';
  return format(new Date(date), 'yyyy-MM-dd', { locale: zhCN });
}

export function formatDateTime(date: Date | string | null) {
  if (!date) return '-';
  return format(new Date(date), 'yyyy-MM-dd HH:mm', { locale: zhCN });
}

export function formatRelative(date: Date | string | null) {
  if (!date) return '-';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN });
}

export function getRiskColor(level: string) {
  switch (level) {
    case 'CRITICAL':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'HIGH':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'MEDIUM':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'LOW':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getRiskLabel(level: string) {
  switch (level) {
    case 'CRITICAL':
      return '严重';
    case 'HIGH':
      return '高';
    case 'MEDIUM':
      return '中';
    case 'LOW':
      return '低';
    default:
      return '未评估';
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800';
    case 'SUBMITTED':
      return 'bg-blue-100 text-blue-800';
    case 'UNDER_REVIEW':
      return 'bg-yellow-100 text-yellow-800';
    case 'RECTIFICATION':
      return 'bg-orange-100 text-orange-800';
    case 'CLOSED':
      return 'bg-green-100 text-green-800';
    case 'ESCALATED':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case 'DRAFT':
      return '草稿';
    case 'SUBMITTED':
      return '已提交';
    case 'UNDER_REVIEW':
      return '审核中';
    case 'RECTIFICATION':
      return '整改中';
    case 'CLOSED':
      return '已闭环';
    case 'ESCALATED':
      return '已升级';
    default:
      return status;
  }
}

export function getRoleLabel(role: string) {
  switch (role) {
    case 'BUSINESS':
      return '业务部门';
    case 'LEGAL':
      return '法务';
    case 'PRO_BONO_LAWYER':
      return '公益律师';
    case 'ADMIN':
      return '管理员';
    default:
      return role;
  }
}

export function generateId() {
  return Math.random().toString(36).substring(2, 11);
}
