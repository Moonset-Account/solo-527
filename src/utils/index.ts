import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, differenceInDays, isBefore, isWithinInterval, addDays, startOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, fmt: string = 'yyyy-MM-dd'): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: zhCN });
}

export function formatDateTime(date: string | Date): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
}

export function formatRelativeTime(date: string | Date): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diff = differenceInDays(now, d);

  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  if (diff < 7) return `${diff}天前`;
  return formatDate(d);
}

export function isDateExpired(date: string): boolean {
  if (!date) return false;
  return isBefore(parseISO(date), startOfDay(new Date()));
}

export function isExpiringSoon(date: string, days: number = 30): boolean {
  if (!date) return false;
  const d = parseISO(date);
  const now = new Date();
  const threshold = addDays(now, days);
  return isWithinInterval(d, { start: now, end: threshold });
}

export function getExpireStatus(date: string): 'normal' | 'warning' | 'expired' {
  if (isDateExpired(date)) return 'expired';
  if (isExpiringSoon(date, 30)) return 'warning';
  return 'normal';
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    PENDING: 'bg-warning-100 text-warning-600 border-warning-200',
    APPROVED: 'bg-primary-100 text-primary-600 border-primary-200',
    SCHEDULED: 'bg-primary-100 text-primary-600 border-primary-200',
    COMPLETED: 'bg-success-100 text-success-600 border-success-200',
    REJECTED: 'bg-danger-100 text-danger-600 border-danger-200',
    CANCELLED: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    IN_PROGRESS: 'bg-warning-100 text-warning-600 border-warning-200',
    DRAFT: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    OPEN: 'bg-danger-100 text-danger-600 border-danger-200',
    RESOLVED: 'bg-success-100 text-success-600 border-success-200',
    NONE: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    PROCESSING: 'bg-warning-100 text-warning-600 border-warning-200',
    ANALYZING: 'bg-primary-100 text-primary-600 border-primary-200',
    ARCHIVED: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    COMPLIANT: 'bg-success-100 text-success-600 border-success-200',
    WARNING: 'bg-warning-100 text-warning-600 border-warning-200',
    NON_COMPLIANT: 'bg-danger-100 text-danger-600 border-danger-200',
    UNREAD: 'bg-primary-500',
    READ: 'bg-neutral-300',
    FAILED: 'bg-danger-500',
    SENT: 'bg-success-500',
  };
  return colorMap[status] || 'bg-neutral-100 text-neutral-500 border-neutral-200';
}

export function getStatusText(status: string): string {
  const textMap: Record<string, string> = {
    DRAFT: '草稿',
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已驳回',
    SCHEDULED: '已排期',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    IN_PROGRESS: '进行中',
    NONE: '无冲突',
    OPEN: '待处理',
    RESOLVED: '已解决',
    PROCESSING: '处理中',
    ANALYZING: '分析中',
    ARCHIVED: '已归档',
    COMPLIANT: '合规',
    WARNING: '警告',
    NON_COMPLIANT: '不合规',
    UNREAD: '未读',
    READ: '已读',
    FAILED: '发送失败',
    SENT: '已发送',
    INVENTORY: '库存冲突',
    TIME_OVERLAP: '时间重叠',
    DEVICE: '设备冲突',
  };
  return textMap[status] || status;
}

export function getRoleText(role: string): string {
  const roleMap: Record<string, string> = {
    ADMIN: '系统管理员',
    DEVICE_TEACHER: '设备老师',
    PRINCIPAL: '实验负责人',
    RESEARCHER: '科研人员',
  };
  return roleMap[role] || role;
}

export function getPriorityColor(priority: string): string {
  const colorMap: Record<string, string> = {
    HIGH: 'text-danger-500',
    MEDIUM: 'text-warning-500',
    LOW: 'text-neutral-500',
  };
  return colorMap[priority] || 'text-neutral-500';
}

export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function confirmDialog(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const confirmed = window.confirm(message);
    resolve(confirmed);
  });
}
