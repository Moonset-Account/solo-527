import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | undefined) {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD');
}

export function formatDateTime(date: string | Date | undefined) {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

export function formatTime(time: string | undefined) {
  if (!time) return '-';
  return time.substring(0, 5);
}

export function formatMoney(value: string | number | undefined) {
  if (value === undefined || value === null) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `¥${num.toFixed(2)}`;
}

export function maskIdCard(idCard: string | undefined) {
  if (!idCard) return '-';
  if (idCard.length <= 6) return idCard;
  return `${idCard.substring(0, 4)}****${idCard.substring(idCard.length - 4)}`;
}

export function maskPhone(phone: string | undefined) {
  if (!phone) return '-';
  if (phone.length <= 7) return phone;
  return `${phone.substring(0, 3)}****${phone.substring(phone.length - 4)}`;
}

export function getOrderStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    verified: '已审核',
    cancelled: '已取消',
    refunded: '已退款',
  };
  return map[status] || status;
}

export function getOrderStatusColor(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    verified: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    refunded: 'bg-purple-100 text-purple-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}

export function getVerificationStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
  };
  return map[status] || status;
}

export function getVerificationStatusColor(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}

export function getRefundStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '待审核',
    reviewing: '审核中',
    approved: '已批准',
    rejected: '已驳回',
    completed: '已完成',
    abnormal: '异常',
  };
  return map[status] || status;
}

export function getRefundStatusColor(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    reviewing: 'bg-blue-100 text-blue-800',
    approved: 'bg-indigo-100 text-indigo-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-green-100 text-green-800',
    abnormal: 'bg-orange-100 text-orange-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}

export function getNotificationTypeText(type: string) {
  const map: Record<string, string> = {
    refund_abnormal: '退票异常',
    inventory_warning: '库存预警',
    verification_alert: '审核提醒',
    order_anomaly: '订单异常',
  };
  return map[type] || type;
}

export function getZoneTypeText(type: string) {
  const map: Record<string, string> = {
    vip: 'VIP',
    premium: '优等',
    standard: '普通',
    economy: '经济',
    standing: '站票',
  };
  return map[type] || type;
}

export function getSeatStatusText(status: string) {
  const map: Record<string, string> = {
    available: '可售',
    held: '锁定',
    sold: '已售',
    refunded: '已退',
    scanned: '已入场',
  };
  return map[status] || status;
}

export function getSeatStatusClass(status: string) {
  const map: Record<string, string> = {
    available: 'bg-green-500',
    held: 'bg-yellow-500',
    sold: 'bg-gray-400',
    refunded: 'bg-purple-500',
    scanned: 'bg-blue-500',
  };
  return map[status] || 'bg-gray-300';
}
