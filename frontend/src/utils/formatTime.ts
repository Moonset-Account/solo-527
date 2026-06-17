import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { DATE_FORMAT, DATE_FORMAT_SHORT } from './constants';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export function formatTime(date: string | Date | number, format: string = DATE_FORMAT): string {
  if (!date) return '-';
  return dayjs(date).format(format);
}

export function formatDateShort(date: string | Date | number): string {
  return formatTime(date, DATE_FORMAT_SHORT);
}

export function formatRelativeTime(date: string | Date | number): string {
  if (!date) return '-';
  return dayjs(date).fromNow();
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '-';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  if (minutes > 0) {
    return `${minutes}分钟${secs}秒`;
  }
  return `${secs}秒`;
}

export function formatDurationLong(seconds: number): string {
  if (!seconds || seconds < 0) return '-';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}小时`);
  if (minutes > 0) parts.push(`${minutes}分钟`);
  
  return parts.length > 0 ? parts.join('') : '1分钟内';
}

export function isOvertime(date: string | Date | number, limitHours: number = 24): boolean {
  if (!date) return false;
  const now = dayjs();
  const target = dayjs(date);
  const diffHours = now.diff(target, 'hour');
  return diffHours > limitHours;
}

export function getTimeAgo(date: string | Date | number): string {
  if (!date) return '-';
  return dayjs(date).fromNow();
}

export function getTimeRange(start: string | Date | number, end: string | Date | number): number {
  if (!start || !end) return 0;
  return dayjs(end).diff(dayjs(start), 'second');
}

export function getTodayRange(): [string, string] {
  const start = dayjs().startOf('day').format(DATE_FORMAT);
  const end = dayjs().endOf('day').format(DATE_FORMAT);
  return [start, end];
}

export function getWeekRange(): [string, string] {
  const start = dayjs().startOf('week').format(DATE_FORMAT);
  const end = dayjs().endOf('week').format(DATE_FORMAT);
  return [start, end];
}

export function getMonthRange(): [string, string] {
  const start = dayjs().startOf('month').format(DATE_FORMAT);
  const end = dayjs().endOf('month').format(DATE_FORMAT);
  return [start, end];
}
