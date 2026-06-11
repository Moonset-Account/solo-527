import { format, formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

export function formatDate(date: Date | string | null | undefined, pattern: string = "yyyy-MM-dd HH:mm:ss") {
  if (!date) return "--";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "--";
  return format(d, pattern, { locale: zhCN });
}

export function formatRelativeTime(date: Date | string | null | undefined) {
  if (!date) return "--";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "--";
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}时${minutes}分`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters.toFixed(0)}米`;
  return `${(meters / 1000).toFixed(2)}公里`;
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: "text-yellow-500 bg-yellow-500/10",
    assigned: "text-blue-500 bg-blue-500/10",
    picked: "text-purple-500 bg-purple-500/10",
    delivering: "text-info-500 bg-info-500/10",
    completed: "text-success-500 bg-success-500/10",
    exception: "text-danger-500 bg-danger-500/10",
    idle: "text-success-500 bg-success-500/10",
    busy: "text-warning-500 bg-warning-500/10",
    offline: "text-slate-500 bg-slate-500/10",
    processing: "text-blue-500 bg-blue-500/10",
    resolved: "text-success-500 bg-success-500/10",
    closed: "text-slate-500 bg-slate-500/10",
  };
  return colorMap[status] || "text-slate-500 bg-slate-500/10";
}

export function getStatusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    pending: "待分配",
    assigned: "已分配",
    picked: "已取货",
    delivering: "配送中",
    completed: "已完成",
    exception: "异常",
    idle: "空闲",
    busy: "忙碌",
    offline: "离线",
    timeout: "超时",
    temperature: "温控异常",
    discrepancy: "签收差异",
    damage: "破损",
    other: "其他",
    processing: "处理中",
    resolved: "已解决",
    closed: "已关闭",
  };
  return labelMap[status] || status;
}

export function getPriorityColor(priority: string): string {
  const colorMap: Record<string, string> = {
    normal: "text-slate-400 bg-slate-500/10",
    urgent: "text-warning-500 bg-warning-500/10",
    vip: "text-purple-500 bg-purple-500/10",
  };
  return colorMap[priority] || colorMap.normal;
}

export function getPriorityLabel(priority: string): string {
  const labelMap: Record<string, string> = {
    normal: "普通",
    urgent: "加急",
    vip: "VIP",
  };
  return labelMap[priority] || priority;
}
