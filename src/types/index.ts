export interface Room {
  id: number;
  name: string;
  address: string;
  area: number;
  unitType: string;
  status: 'vacant' | 'rented' | 'maintenance' | 'reserved';
  monthlyRent: number;
  images: string[];
  vacantDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: number;
  roomId: number;
  roomName: string;
  tenantId: number;
  tenantName: string;
  consultantId: number;
  consultantName: string;
  appointmentTime: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'conflict';
  remark: string;
  createdAt: string;
}

export interface WorkOrder {
  id: number;
  type: 'repair' | 'clean' | 'inspect' | 'followup';
  roomId: number;
  roomName: string;
  tenantId: number;
  tenantName: string;
  assigneeId: number;
  assigneeName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'closed';
  description: string;
  followUpResult: string;
  satisfaction: number;
  createdAt: string;
  completedAt: string;
}

export interface Contract {
  id: number;
  templateId: number;
  roomId: number;
  roomName: string;
  tenantId: number;
  tenantName: string;
  ownerId: number;
  ownerName: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  status: 'draft' | 'owner_signed' | 'tenant_signed' | 'archived' | 'terminated';
  content: string;
  signedAt: string;
  createdAt: string;
}

export interface ContractTemplate {
  id: number;
  name: string;
  content: string;
  fields: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Settlement {
  id: number;
  contractId: number;
  ownerId: number;
  ownerName: string;
  period: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approvedBy: string;
  approvedAt: string;
  remark: string;
  createdAt: string;
}

export interface SettlementRule {
  id: number;
  name: string;
  projectType: string;
  cycle: 'monthly' | 'quarterly' | 'yearly';
  ratio: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExceptionOrder {
  id: number;
  type: 'room_conflict' | 'system_error' | 'payment_failed' | 'message_failed';
  sourceId: number;
  sourceType: 'appointment' | 'contract' | 'payment' | 'message';
  description: string;
  status: 'open' | 'processing' | 'resolved';
  handlerId: number;
  handlerName: string;
  resolutionNote: string;
  createdAt: string;
  resolvedAt: string;
}

export interface MessageRecord {
  id: number;
  type: 'sms' | 'email' | 'push';
  recipientId: number;
  recipientName: string;
  subject: string;
  content: string;
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
  result: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: number;
  contractId: number;
  tenantId: number;
  tenantName: string;
  amount: number;
  method: 'alipay' | 'wechat' | 'bank';
  status: 'pending' | 'success' | 'failed';
  retryCount: number;
  result: string;
  transactionId: string;
  createdAt: string;
}

export interface VacancyStats {
  date: string;
  totalRooms: number;
  vacantRooms: number;
  vacancyRate: number;
}

export interface VacancyAlert {
  id: number;
  projectArea: string;
  vacancyRate: number;
  threshold: number;
  triggeredAt: string;
  isRead: boolean;
}

export interface AppointmentSlotConfig {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  interval: number;
  isActive: boolean;
}

export interface WorkflowNodeConfig {
  id: number;
  processType: 'contract' | 'settlement' | 'appointment';
  nodeName: string;
  nodeOrder: number;
  approverRole: string;
  isRequired: boolean;
  isActive: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export type StatusType =
  | 'vacant' | 'rented' | 'maintenance' | 'reserved'
  | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'conflict'
  | 'draft' | 'owner_signed' | 'tenant_signed' | 'archived' | 'terminated'
  | 'open' | 'processing' | 'resolved'
  | 'sent' | 'failed' | 'success'
  | 'in_progress' | 'closed'
  | 'approved' | 'rejected' | 'paid';
