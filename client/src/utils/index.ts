import dayjs from 'dayjs';
import type { ApplicationStatus, LicenseStatus, LicenseType, BillingCycle } from '@/types';

export const statusMap: Record<ApplicationStatus, { text: string; color: string }> = {
  PENDING: { text: '待处理', color: 'orange' },
  PROCESSING: { text: '处理中', color: 'blue' },
  COMPLETED: { text: '已完成', color: 'green' },
  CLOSED_ABNORMAL: { text: '异常关闭', color: 'red' },
};

export const licenseStatusMap: Record<LicenseStatus, { text: string; color: string }> = {
  ACTIVE: { text: '生效中', color: 'green' },
  EXPIRED: { text: '已过期', color: 'default' },
  CANCELLED: { text: '已取消', color: 'red' },
};

export const licenseTypeMap: Record<LicenseType, { text: string; color: string }> = {
  TRIAL: { text: '试用', color: 'gold' },
  PAID: { text: '付费', color: 'blue' },
};

export const billingCycleMap: Record<BillingCycle, string> = {
  MONTHLY: '月付',
  QUARTERLY: '季付',
  YEARLY: '年付',
};

export const roleMap: Record<string, string> = {
  USER: '普通用户',
  OP_ADMIN: '运营管理员',
  FIN_ADMIN: '财务管理员',
  SYS_ADMIN: '系统管理员',
};

export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD') {
  return dayjs(date).format(format);
}

export function formatDateTime(date: string | Date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

export function formatMoney(amount: number) {
  return `¥${amount.toFixed(2)}`;
}

export function daysBetween(date1: string | Date, date2: string | Date) {
  const d1 = dayjs(date1);
  const d2 = dayjs(date2);
  return d2.diff(d1, 'day');
}

export function daysFromNow(date: string | Date) {
  const target = dayjs(date);
  const now = dayjs();
  return target.diff(now, 'day');
}
