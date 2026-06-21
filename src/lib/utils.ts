import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd", { locale: zhCN });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd HH:mm", { locale: zhCN });
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
}

export function getOverdueDays(dueDate: Date | string): number {
  const d = typeof dueDate === "string" ? parseISO(dueDate) : dueDate;
  const today = new Date();
  return Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function getOverdueBadgeStyle(days: number): string {
  if (days <= 0) return "bg-slate-100 text-slate-600";
  if (days <= 7) return "bg-yellow-100 text-yellow-800";
  if (days <= 30) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700",
    PAID: "bg-emerald-100 text-emerald-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    CONFIRMED: "bg-emerald-100 text-emerald-700",
    SIGNED: "bg-emerald-100 text-emerald-700",
    RESOLVED: "bg-emerald-100 text-emerald-700",
    PENDING: "bg-amber-100 text-amber-700",
    UNPAID: "bg-amber-100 text-amber-700",
    PENDING_SIGN: "bg-amber-100 text-amber-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    HANDLING: "bg-blue-100 text-blue-700",
    PARTIAL: "bg-purple-100 text-purple-700",
    OVERDUE: "bg-orange-100 text-orange-700",
    EXCEPTION: "bg-red-100 text-red-700",
    CRITICAL: "bg-red-100 text-red-700",
    EXPIRED: "bg-slate-100 text-slate-600",
    TERMINATED: "bg-slate-100 text-slate-600",
    CANCELLED: "bg-slate-100 text-slate-600",
    ARCHIVED: "bg-slate-100 text-slate-600",
    OPEN: "bg-red-100 text-red-700",
    DRAFT: "bg-slate-100 text-slate-600",
  };
  return colors[status] || "bg-slate-100 text-slate-600";
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: "bg-slate-100 text-slate-600",
    MEDIUM: "bg-blue-100 text-blue-700",
    HIGH: "bg-orange-100 text-orange-700",
    URGENT: "bg-red-100 text-red-700",
  };
  return colors[priority] || colors.LOW;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: "有效",
    PAID: "已支付",
    COMPLETED: "已完成",
    CONFIRMED: "已确认",
    SIGNED: "已签署",
    RESOLVED: "已解决",
    PENDING: "待处理",
    UNPAID: "未支付",
    PENDING_SIGN: "待签署",
    IN_PROGRESS: "处理中",
    HANDLING: "处理中",
    PARTIAL: "部分支付",
    OVERDUE: "已逾期",
    EXCEPTION: "异常",
    CRITICAL: "严重",
    EXPIRED: "已到期",
    TERMINATED: "已终止",
    CANCELLED: "已取消",
    ARCHIVED: "已归档",
    OPEN: "待处理",
    DRAFT: "草稿",
    LOW: "低",
    MEDIUM: "中",
    HIGH: "高",
    URGENT: "紧急",
    COLLECTION: "催收",
    REPAIR: "维修",
    VISIT: "回访",
    COMPLAINT: "投诉",
  };
  return labels[status] || status;
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: "管理员",
    FINANCE: "财务专员",
    FRONTLINE: "一线人员",
  };
  return labels[role] || role;
}

export function generateBillNo(date: Date, index: number): string {
  return `BILL${format(date, "yyyyMM")}${String(index).padStart(3, "0")}`;
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function formatCNY(amount: number): string {
  return `¥${amount.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getSettlementStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    PAID: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-slate-100 text-slate-600",
  };
  return colors[status] || "bg-slate-100 text-slate-600";
}
