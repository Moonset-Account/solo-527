import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}天${remainingHours}小时` : `${days}天`;
}

export function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
    case 'RESOLVED':
    case 'VALID':
      return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'PENDING':
    case 'PENDING_INVALID':
    case 'PROCESSING':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'INVALID':
    case 'FALSE_POSITIVE':
    case 'ESCALATED':
      return 'bg-red-500/10 text-red-600 border-red-500/20';
    default:
      return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
  }
}

export function getStatusText(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: '有效',
    PENDING_INVALID: '待失效',
    INVALID: '已失效',
    PENDING: '待处理',
    PROCESSING: '处理中',
    RESOLVED: '已解决',
    ESCALATED: '已升级',
    VALID: '有效命中',
    FALSE_POSITIVE: '误报',
    HIGH: '高',
    MEDIUM: '中',
    LOW: '低',
  };
  return map[status] || status;
}

export function getPriorityColor(priority: string): string {
  switch (priority.toUpperCase()) {
    case 'HIGH':
      return 'bg-red-500';
    case 'MEDIUM':
      return 'bg-amber-500';
    case 'LOW':
      return 'bg-green-500';
    default:
      return 'bg-slate-500';
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function createHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
