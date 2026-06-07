import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} 分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours} 小时 ${mins} 分钟`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

export function formatPercent(num: number): string {
  return `${(num * 100).toFixed(1)}%`;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getTimePeriod(hour: number): string {
  if (hour >= 6 && hour < 9) return '早高峰';
  if (hour >= 9 && hour < 12) return '上午';
  if (hour >= 12 && hour < 14) return '午间';
  if (hour >= 14 && hour < 17) return '下午';
  if (hour >= 17 && hour < 20) return '晚高峰';
  return '夜间';
}

export function getPrescriptionTypeName(type: string): string {
  const map: Record<string, string> = {
    emergency: '急诊处方',
    normal: '普通处方',
    specialist: '专科处方',
  };
  return map[type] || type;
}

export function getSeverityColor(severity: string): string {
  const map: Record<string, string> = {
    normal: 'text-success-500',
    warning: 'text-warning-500',
    critical: 'text-danger-500',
  };
  return map[severity] || 'text-gray-500';
}

export function getSeverityBgColor(severity: string): string {
  const map: Record<string, string> = {
    normal: 'bg-green-50',
    warning: 'bg-orange-50',
    critical: 'bg-red-50',
  };
  return map[severity] || 'bg-gray-50';
}
