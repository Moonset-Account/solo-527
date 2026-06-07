import type { EventLevel, EventStatus, NotificationStatus } from './types';

export const levelConfig: Record<EventLevel, { label: string; color: string; bgColor: string }> = {
  low: { label: '低', color: 'text-green-700', bgColor: 'bg-green-100' },
  medium: { label: '中', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  high: { label: '高', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  critical: { label: '紧急', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const statusConfig: Record<EventStatus, { label: string; color: string; bgColor: string }> = {
  unconfirmed: { label: '未确认', color: 'text-amber-700', bgColor: 'bg-amber-100 border-amber-300' },
  processing: { label: '处理中', color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-300' },
  closed: { label: '已关闭', color: 'text-gray-700', bgColor: 'bg-gray-100 border-gray-300' },
};

export const notificationConfig: Record<NotificationStatus, { label: string; color: string; icon: string }> = {
  pending: { label: '待通知', color: 'text-gray-500', icon: '⏳' },
  success: { label: '已通知', color: 'text-green-600', icon: '✓' },
  failed: { label: '通知失败', color: 'text-red-600', icon: '✗' },
};

export const formatDuration = (minutes: number | null): string => {
  if (!minutes) return '-';
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return `${hours} 小时 ${mins} 分`;
  const days = Math.floor(hours / 24);
  const h = hours % 24;
  return `${days} 天 ${h} 小时`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
