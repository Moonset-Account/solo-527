export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export type BillType = 'rent' | 'deposit' | 'service' | 'other';
export type BillStatus = 'unpaid' | 'paid' | 'partial' | 'void';
export type PropertyType = 'private_office' | 'hot_desk' | 'meeting_room' | 'long_term';
export type DepositType = 'received' | 'refunded' | 'deducted';
export type DepositStatus = 'active' | 'refunded' | 'deducted';
export type TicketType = 'maintenance' | 'complaint';
export type TicketPriority = 'low' | 'medium' | 'high';
export type TicketStatus = 'pending' | 'processing' | 'completed' | 'closed';
export type PropertyStatus = 'vacant' | 'rented' | 'maintenance' | 'closed';
export type LeaseStatus = 'active' | 'expired' | 'terminated' | 'pending';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: number;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginatedParams {
  page?: number;
  pageSize?: number;
  [key: string]: any;
}

export interface Property {
  id: string;
  code: string;
  name: string;
  type: PropertyType;
  building: string;
  floor: number;
  area: number;
  status: PropertyStatus;
  price: number;
  capacity?: number;
  basePrice?: number;
  closeReason?: string;
  source?: string;
  sourceRemark?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lease {
  id: string;
  leaseNo: string;
  propertyId: string;
  propertyName: string;
  tenantName: string;
  tenantPhone: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  status: LeaseStatus;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bill {
  id: string;
  billNo: string;
  leaseId: string;
  leaseNo: string;
  type: BillType;
  amount: number;
  billDate: string;
  dueDate: string;
  status: BillStatus;
  reconciled: boolean;
  reconcileNote?: string;
  source: string;
  lease?: Lease;
  paidAmount?: number;
  paidDate?: Date;
  reconciledAt?: Date;
  reconciledBy?: string;
  reconciler?: User;
  sourceRemark?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deposit {
  id: string;
  depositNo: string;
  leaseId: string;
  leaseNo: string;
  amount: number;
  type: DepositType;
  status: DepositStatus;
  date: string;
  source: string;
  note?: string;
  receiveDate?: Date;
  refundDate?: Date;
  sourceRemark?: string;
  lease?: Lease;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  ticketNo: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  title: string;
  description?: string;
  propertyId: string;
  propertyName: string;
  reporterName?: string;
  reporterContact?: string;
  assigneeId?: string;
  assignee?: User;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  closeNote?: string;
}

export interface TicketLog {
  id: string;
  ticketId: string;
  action: string;
  operator: string;
  remark?: string;
  createdAt: string;
}

export type PriceType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface PricePlan {
  id: string;
  propertyId: string;
  propertyName: string;
  name: string;
  price: number;
  priceType: PriceType;
  effectiveDate: string;
  isCurrent: boolean;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomStatusLog {
  id: string;
  propertyId: string;
  status: PropertyStatus;
  reason: string;
  operator: string;
  createdAt: string;
}

export interface SourceRecord {
  id: string;
  sourceType: string;
  sourceId: string;
  operator: string;
  action: string;
  detail: string;
  createdAt: string;
}

export interface ExportRecord {
  id: string;
  exportType: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}
