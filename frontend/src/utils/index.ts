import dayjs from 'dayjs';
import type { ReminderLevel, ReminderStatus } from '@/types';

export const REMINDER_LEVEL_COLORS: Record<ReminderLevel, string> = {
  1: '#E53935',
  2: '#FB8C00',
  3: '#FDD835',
  4: '#43A047',
};

export const REMINDER_LEVEL_NAMES: Record<ReminderLevel, string> = {
  1: '紧急',
  2: '高',
  3: '中',
  4: '低',
};

export const REMINDER_STATUS_COLORS: Record<ReminderStatus, string> = {
  pending: 'bg-red-100 text-red-800',
  processing: 'bg-orange-100 text-orange-800',
  resolved: 'bg-green-100 text-green-800',
  ignored: 'bg-gray-100 text-gray-800',
};

export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  ignored: '已忽略',
};

export const INVENTORY_STATUS_LABELS: Record<string, string> = {
  available: '可预订',
  booked: '已预订',
  locked: '已锁定',
  maintenance: '维护中',
};

export const INVENTORY_STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  booked: 'bg-red-100 text-red-800',
  locked: 'bg-yellow-100 text-yellow-800',
  maintenance: 'bg-gray-100 text-gray-800',
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  checked_in: '已入住',
  checked_out: '已退房',
  cancelled: '已取消',
  no_show: '未入住',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  checked_in: 'bg-green-100 text-green-800',
  checked_out: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-orange-100 text-orange-800',
};

export const CONVERSION_STAGE_LABELS: Record<string, string> = {
  inquiry: '咨询',
  quoted: '已报价',
  deposit_paid: '已付定金',
  fully_paid: '已付清',
  completed: '已完成',
  lost: '已流失',
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

export const TASK_PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export const ITINERARY_STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
};

export const ITINERARY_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-blue-100 text-blue-800',
};

export const ROLE_LABELS: Record<string, string> = {
  super_admin: '超级管理员',
  host: '民宿房东',
  operator: '运营人员',
  receptionist: '前台接待',
};

export const formatCurrency = (amount: number): string => {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

export const calculateNights = (checkIn: string, checkOut: string): number => {
  return dayjs(checkOut).diff(dayjs(checkIn), 'day');
};

export const getDateRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  for (let d = start; d.isBefore(end); d = d.add(1, 'day')) {
    dates.push(d.format('YYYY-MM-DD'));
  }
  return dates;
};

export const getReminderLevelClass = (level: ReminderLevel): string => {
  return `reminder-badge-level-${level}`;
};

export const getInventoryStatusClass = (status: string): string => {
  return `calendar-cell-${status}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export const downloadFile = (content: string, filename: string, contentType: string = 'text/plain'): void => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
