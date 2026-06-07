import { HazardStatus, HazardLevel, FineStatus, AppealStatus } from '@/types';
import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const statusConfig: Record<HazardStatus, { label: string; color: string; bgColor: string }> = {
  [HazardStatus.PENDING]: { label: '待整改', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  [HazardStatus.IN_PROGRESS]: { label: '整改中', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  [HazardStatus.UNDER_REVIEW]: { label: '复查中', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  [HazardStatus.CLOSED]: { label: '已关闭', color: 'text-green-700', bgColor: 'bg-green-100' },
  [HazardStatus.REJECTED]: { label: '整改驳回', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const levelConfig: Record<HazardLevel, { label: string; color: string; bgColor: string }> = {
  [HazardLevel.LOW]: { label: '一般', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  [HazardLevel.MEDIUM]: { label: '较重', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  [HazardLevel.HIGH]: { label: '严重', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  [HazardLevel.CRITICAL]: { label: '特别严重', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const fineStatusConfig: Record<FineStatus, { label: string; color: string; bgColor: string }> = {
  [FineStatus.PENDING]: { label: '待确认', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  [FineStatus.CONFIRMED]: { label: '已确认', color: 'text-green-700', bgColor: 'bg-green-100' },
  [FineStatus.REJECTED]: { label: '已驳回', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const appealStatusConfig: Record<AppealStatus, { label: string; color: string; bgColor: string }> = {
  [AppealStatus.PENDING]: { label: '待处理', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  [AppealStatus.APPROVED]: { label: '已通过', color: 'text-green-700', bgColor: 'bg-green-100' },
  [AppealStatus.REJECTED]: { label: '已驳回', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format);
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

export function isOverdue(deadline: string | Date): boolean {
  return dayjs().isAfter(dayjs(deadline));
}

export function getDaysRemaining(deadline: string | Date): number {
  return dayjs(deadline).diff(dayjs(), 'day');
}

export function exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1'): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}.xlsx`);
}

export function exportToCSV(data: any[], fileName: string): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `${fileName}.csv`);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getFloorLabel(floor: number): string {
  if (floor < 0) return `地下${Math.abs(floor)}层`;
  return `${floor}层`;
}

export const chartColors = {
  primary: '#165DFF',
  warning: '#FF7D00',
  success: '#00B42A',
  danger: '#F53F3F',
  info: '#86909C',
  purple: '#722ED1',
  cyan: '#0FC6C2',
};

export const heatmapColors = ['#E8F3FF', '#BEDAFF', '#94BFFF', '#6AA1FF', '#4080FF', '#165DFF', '#0E42D2'];
