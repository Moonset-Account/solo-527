export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export const AppointmentStatusLabels: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: '待确认',
  [AppointmentStatus.CONFIRMED]: '已确认',
  [AppointmentStatus.CHECKED_IN]: '已到店',
  [AppointmentStatus.COMPLETED]: '已完成',
  [AppointmentStatus.CANCELLED]: '已取消',
  [AppointmentStatus.NO_SHOW]: '爽约',
};

export interface Counselor {
  id: string;
  name: string;
  title: string;
  avatar?: string;
  description?: string;
  specialties?: string[];
  yearsOfExperience: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum RefundRuleType {
  FULL_REFUND = 'full_refund',
  PARTIAL_REFUND = 'partial_refund',
  NO_REFUND = 'no_refund',
}

export const RefundRuleTypeLabels: Record<RefundRuleType, string> = {
  [RefundRuleType.FULL_REFUND]: '全额退款',
  [RefundRuleType.PARTIAL_REFUND]: '部分退款',
  [RefundRuleType.NO_REFUND]: '不退款',
};

export interface Package {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  sessionCount: number;
  refundRuleType: RefundRuleType;
  refundDeadlineHours?: number;
  refundPercentage?: number;
  refundNotes?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  counselorId: string;
  counselor?: Counselor;
  packageId?: string;
  package?: Package;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  appointmentTime: Date;
  reason: string;
  status: AppointmentStatus;
  source?: string;
  notes?: string;
  lastOperatorId?: string;
  lastOperatorName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}
