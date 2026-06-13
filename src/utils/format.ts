import type { RepairType, Urgency, RequestStatus, StepType } from '@/types';

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function formatDuration(hours: number): string {
  const days = Math.floor(hours / 24);
  const remainingHours = Math.floor(hours % 24);
  const minutes = Math.floor((hours % 1) * 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}天`);
  if (remainingHours > 0) parts.push(`${remainingHours}小时`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}分钟`);
  return parts.join('');
}

const repairTypeLabels: Record<RepairType, string> = {
  plumbing: '水电维修',
  electrical: '电器维修',
  furniture: '家具维修',
  door_window: '门窗维修',
  network: '网络维修',
  other: '其他',
};

export function getRepairTypeLabel(type: RepairType): string {
  return repairTypeLabels[type] || type;
}

const urgencyLabels: Record<Urgency, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '紧急',
};

export function getUrgencyLabel(urgency: Urgency): string {
  return urgencyLabels[urgency] || urgency;
}

const statusLabels: Record<RequestStatus, string> = {
  pending: '待处理',
  identity_verifying: '身份核验中',
  quota_checking: '名额核查中',
  assigned: '已分配',
  processing: '处理中',
  completed: '已完成',
  rejected: '已驳回',
  waitlisted: '候补中',
};

export function getStatusLabel(status: RequestStatus): string {
  return statusLabels[status] || status;
}

const stepTypeLabels: Record<StepType, string> = {
  identity_review: '身份审核',
  repair_process: '维修处理',
  seat_change: '座位变更',
  status_change: '状态变更',
  quota_check: '名额核查',
};

export function getStepTypeLabel(stepType: StepType): string {
  return stepTypeLabels[stepType] || stepType;
}
