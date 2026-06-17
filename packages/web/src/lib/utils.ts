import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export { dayjs };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number | string | undefined | null, digits = 2) {
  if (n === undefined || n === null || Number.isNaN(n)) return '-';
  return Number(n).toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatDate(d: string | Date | undefined | null, fmt = 'YYYY-MM-DD') {
  if (!d) return '-';
  return dayjs(d).format(fmt);
}

export function formatDateTime(d: string | Date | undefined | null) {
  return formatDate(d, 'YYYY-MM-DD HH:mm:ss');
}

export function timeAgo(d: string | Date | undefined | null) {
  if (!d) return '-';
  return dayjs(d).fromNow();
}

export const alertLevelColors: Record<string, string> = {
  critical: 'bg-danger-100 text-danger-700',
  warning: 'bg-warning-100 text-warning-700',
  info: 'bg-primary-100 text-primary-700',
};

export const alertLevelLabels: Record<string, string> = {
  critical: '严重',
  warning: '警告',
  info: '提示',
};

export const alertStatusColors: Record<string, string> = {
  pending: 'bg-danger-100 text-danger-700',
  processing: 'bg-warning-100 text-warning-700',
  resolved: 'bg-primary-100 text-primary-700',
  ignored: 'bg-slate-100 text-slate-600',
};

export const alertStatusLabels: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  ignored: '已忽略',
};

export const meterStatusColors: Record<string, string> = {
  online: 'bg-primary-100 text-primary-700',
  offline: 'bg-danger-100 text-danger-700',
  maintenance: 'bg-warning-100 text-warning-700',
};

export const meterStatusLabels: Record<string, string> = {
  online: '在线',
  offline: '离线',
  maintenance: '维护中',
};

export const deviceTypeLabels: Record<string, string> = {
  inverter: '逆变器',
  panel: '组件',
  meter: '表计',
  battery: '储能',
  transformer: '变压器',
};

export const deviceStatusColors: Record<string, string> = {
  running: 'bg-primary-100 text-primary-700',
  stopped: 'bg-slate-100 text-slate-600',
  fault: 'bg-danger-100 text-danger-700',
  maintenance: 'bg-warning-100 text-warning-700',
};

export const deviceStatusLabels: Record<string, string> = {
  running: '运行中',
  stopped: '已停机',
  fault: '故障',
  maintenance: '维护中',
};

export const subsidyStatusColors: Record<string, string> = {
  pending: 'bg-warning-100 text-warning-700',
  approved: 'bg-primary-100 text-primary-700',
  paid: 'bg-slate-100 text-slate-700',
};

export const subsidyStatusLabels: Record<string, string> = {
  pending: '待审核',
  approved: '已审批',
  paid: '已发放',
};

export const offlineReasonLabels: Record<string, string> = {
  network: '网络故障',
  power: '电源故障',
  hardware: '硬件故障',
  software: '软件故障',
  maintenance: '计划维护',
  unknown: '未知原因',
};

export const offlineReasonColors: Record<string, string> = {
  network: 'bg-purple-100 text-purple-700',
  power: 'bg-amber-100 text-amber-700',
  hardware: 'bg-danger-100 text-danger-700',
  software: 'bg-blue-100 text-blue-700',
  maintenance: 'bg-warning-100 text-warning-700',
  unknown: 'bg-slate-100 text-slate-600',
};

export function buildQuery(params: Record<string, any>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    sp.append(k, String(v));
  }
  return sp.toString();
}
