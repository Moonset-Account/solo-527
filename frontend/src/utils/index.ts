import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD HH:mm'): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-500',
    pending: 'bg-yellow-100 text-yellow-700',
    redeemed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    expired: 'bg-gray-100 text-gray-500',
    draft: 'bg-gray-100 text-gray-500',
    verifying: 'bg-blue-100 text-blue-700',
    verified: 'bg-cyan-100 text-cyan-700',
    executing: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    success: 'bg-green-100 text-green-700',
  };
  return statusMap[status] || 'bg-gray-100 text-gray-500';
}

export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    active: '上架中',
    inactive: '已下架',
    pending: '待核销',
    redeemed: '已核销',
    cancelled: '已取消',
    expired: '已过期',
    draft: '草稿',
    verifying: '核对中',
    verified: '已核对',
    executing: '执行中',
    completed: '已完成',
    failed: '失败',
    success: '成功',
  };
  return statusMap[status] || status;
}

export function getRoleText(role: string): string {
  const roleMap: Record<string, string> = {
    member: '会员',
    ecommerce: '电商负责人',
    admin: '管理员',
  };
  return roleMap[role] || role;
}
