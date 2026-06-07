import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd', { locale: zhCN });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd HH:mm', { locale: zhCN });
}

export function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toLocaleString('zh-CN');
}

export function formatPercent(num: number): string {
  return num.toFixed(1) + '%';
}

export function formatDays(days: number): string {
  return days.toFixed(1) + '天';
}

export const CHART_COLORS = {
  primary: '#0F4C81',
  secondary: '#00B4D8',
  success: '#2A9D8F',
  warning: '#F77F00',
  danger: '#E63946',
  purple: '#7209B7',
  pink: '#F72585',
  indigo: '#3A0CA3',
  teal: '#4CC9F0',
  gray: '#6C757D',
};

export const CHART_PALETTE = [
  '#0F4C81',
  '#00B4D8',
  '#2A9D8F',
  '#F77F00',
  '#7209B7',
  '#F72585',
  '#3A0CA3',
  '#4CC9F0',
  '#E63946',
  '#6C757D',
];

export const STAGE_COLORS: Record<string, string> = {
  resume: '#0F4C81',
  screen: '#00B4D8',
  interview_1: '#2A9D8F',
  interview_2: '#7209B7',
  interview_3: '#F72585',
  offer: '#F77F00',
  onboard: '#E63946',
};
