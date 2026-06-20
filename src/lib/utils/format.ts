import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Status, Priority, TodoType, ComplianceType, HazardLevel, ReagentCategory } from '$types';

export const statusMap: Record<Status, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  approved: { label: '已批准', color: 'bg-green-100 text-green-800 border-green-300' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-800 border-red-300' },
  completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  processing: { label: '处理中', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  resolved: { label: '已解决', color: 'bg-teal-100 text-teal-800 border-teal-300' },
  failed: { label: '已失败', color: 'bg-rose-100 text-rose-800 border-rose-300' }
};

export const priorityMap: Record<Priority, { label: string; color: string }> = {
  low: { label: '低', color: 'bg-gray-100 text-gray-700' },
  medium: { label: '中', color: 'bg-blue-100 text-blue-700' },
  high: { label: '高', color: 'bg-orange-100 text-orange-700' },
  critical: { label: '紧急', color: 'bg-red-100 text-red-700' }
};

export const todoTypeMap: Record<TodoType, { label: string; icon: string; color: string }> = {
  project_report: { label: '课题报表', icon: 'FileText', color: 'text-primary-600 bg-primary-50' },
  instrument_booking: { label: '仪器预约', icon: 'Calendar', color: 'text-purple-600 bg-purple-50' },
  sample_tracking: { label: '样本去向', icon: 'TestTube', color: 'text-emerald-600 bg-emerald-50' }
};

export const complianceTypeMap: Record<ComplianceType, { label: string; color: string }> = {
  requisition: { label: '领用申请', color: 'text-blue-600' },
  experiment: { label: '实验数据', color: 'text-purple-600' },
  todo: { label: '待办事项', color: 'text-orange-600' },
  risk: { label: '风险处理', color: 'text-red-600' }
};

export const hazardLevelMap: Record<HazardLevel, { label: string; color: string }> = {
  low: { label: '低风险', color: 'bg-green-100 text-green-800' },
  medium: { label: '中风险', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: '高风险', color: 'bg-orange-100 text-orange-800' },
  critical: { label: '极高风险', color: 'bg-red-100 text-red-800 animate-pulse-slow' }
};

export const reagentCategoryMap: Record<ReagentCategory, { label: string; color: string }> = {
  normal: { label: '普通试剂', color: 'bg-gray-100 text-gray-700' },
  hazardous: { label: '危险化学品', color: 'bg-orange-100 text-orange-700' },
  controlled: { label: '管制试剂', color: 'bg-red-100 text-red-700' }
};

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd HH:mm', { locale: zhCN });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MM-dd HH:mm', { locale: zhCN });
}

export function formatDateOnly(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd', { locale: zhCN });
}

export function getStatusBadge(status: Status) {
  return statusMap[status] || statusMap.pending;
}

export function getPriorityBadge(priority: Priority) {
  return priorityMap[priority] || priorityMap.medium;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
