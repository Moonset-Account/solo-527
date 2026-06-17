export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface Property {
  id: number;
  code: string;
  name: string;
  type: string;
  building: string;
  floor: number;
  area: number;
  status: PropertyStatus;
  price: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type PropertyStatus = 'vacant' | 'rented' | 'maintenance' | 'closed';

export interface Lease {
  id: number;
  leaseNo: string;
  propertyId: number;
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

export type LeaseStatus = 'active' | 'expired' | 'terminated' | 'pending';

export interface Bill {
  id: number;
  billNo: string;
  leaseId: number;
  leaseNo: string;
  type: BillType;
  amount: number;
  billDate: string;
  dueDate: string;
  status: BillStatus;
  reconciled: boolean;
  reconcileNote?: string;
  source: string;
  createdAt: string;
}

export type BillType = 'rent' | 'water' | 'electricity' | 'service' | 'other';
export type BillStatus = 'unpaid' | 'paid' | 'overdue' | 'cancelled';

export interface Deposit {
  id: number;
  depositNo: string;
  leaseId: number;
  leaseNo: string;
  amount: number;
  type: DepositType;
  status: DepositStatus;
  date: string;
  source: string;
  note?: string;
}

export type DepositType = 'rent_deposit' | 'utility_deposit';
export type DepositStatus = 'collected' | 'returned' | 'deducted';

export interface Ticket {
  id: number;
  ticketNo: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  title: string;
  description: string;
  propertyId: number;
  propertyName: string;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  closeNote?: string;
}

export type TicketType = 'repair' | 'complaint' | 'other';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'pending' | 'processing' | 'completed' | 'closed';

export interface TicketLog {
  id: number;
  ticketId: number;
  action: string;
  operator: string;
  remark?: string;
  createdAt: string;
}

export interface PricePlan {
  id: number;
  propertyId: number;
  propertyName: string;
  name: string;
  price: number;
  effectiveDate: string;
  isCurrent: boolean;
  source: string;
  createdAt: string;
}

export interface RoomStatusLog {
  id: number;
  propertyId: number;
  status: PropertyStatus;
  reason: string;
  operator: string;
  createdAt: string;
}

export interface SourceRecord {
  id: number;
  sourceType: string;
  sourceId: number;
  operator: string;
  action: string;
  detail: string;
  createdAt: string;
}

export interface ExportRecord {
  id: number;
  exportType: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
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
