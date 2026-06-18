export enum WaitlistStatus {
  WAITING = 'waiting',
  NOTIFIED = 'notified',
  CONVERTED = 'converted',
  CANCELLED = 'cancelled',
}

export const WaitlistStatusLabels: Record<WaitlistStatus, string> = {
  [WaitlistStatus.WAITING]: '等待中',
  [WaitlistStatus.NOTIFIED]: '已通知',
  [WaitlistStatus.CONVERTED]: '已转预约',
  [WaitlistStatus.CANCELLED]: '已取消',
};

export interface WaitlistEntry {
  id: string;
  counselorId: string;
  counselor?: any;
  clientName: string;
  clientPhone: string;
  preferredTime?: Date;
  reason?: string;
  status: WaitlistStatus;
  notes?: string;
  lastOperatorId?: string;
  lastOperatorName?: string;
  createdAt: Date;
  updatedAt: Date;
}
