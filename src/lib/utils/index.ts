import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export function formatDate(date: Date | string, fmt = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, fmt);
}

export function formatNumber(num: number, decimals = 0): string {
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatPercent(num: number, decimals = 2): string {
  return (num * 100).toFixed(decimals) + '%';
}

export function formatSignedPercent(num: number, decimals = 2): string {
  const pct = (num * 100).toFixed(decimals);
  return num >= 0 ? `+${pct}%` : `${pct}%`;
}

export function getDateRange(days: number): { start: string; end: string } {
  const end = new Date();
  const start = subDays(end, days - 1);
  return {
    start: formatDate(start),
    end: formatDate(end)
  };
}

export function getMonthRange(monthOffset = 0): { start: string; end: string } {
  const base = subMonths(new Date(), monthOffset);
  const start = startOfMonth(base);
  const end = endOfMonth(base);
  return {
    start: formatDate(start),
    end: formatDate(end)
  };
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function severityLabel(severity: string): string {
  const map: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '严重'
  };
  return map[severity] || severity;
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    open: '待处理',
    investigating: '调查中',
    resolved: '已解决',
    ignored: '已忽略',
    draft: '草稿',
    published: '已发布',
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    sent: '已发送'
  };
  return map[status] || status;
}

export function channelLabel(channel: string): string {
  const map: Record<string, string> = {
    email: '邮件',
    wework: '企业微信',
    dingtalk: '钉钉'
  };
  return map[channel] || channel;
}
