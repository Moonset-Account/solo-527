export type UserRole = 'researcher' | 'admin';
export type Status = 'pending' | 'approved' | 'rejected' | 'completed' | 'processing' | 'resolved' | 'failed';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type TodoType = 'project_report' | 'instrument_booking' | 'sample_tracking';
export type ComplianceType = 'requisition' | 'experiment' | 'todo' | 'risk';
export type HazardLevel = 'low' | 'medium' | 'high' | 'critical';
export type ReagentCategory = 'normal' | 'hazardous' | 'controlled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Reagent {
  id: string;
  name: string;
  casNumber?: string;
  category: ReagentCategory;
  stock: number;
  unit: string;
  hazardLevel?: HazardLevel;
}

export interface Requisition {
  id: string;
  reagentId: string;
  reagent?: Reagent | null;
  userId: string;
  userName: string;
  quantity: number;
  purpose: string;
  status: Status;
  rejectionReason?: string;
  createdAt: Date;
  complianceRecordId?: string;
}

export interface ComplianceRecord {
  id: string;
  type: ComplianceType;
  referenceId: string;
  status: Status;
  operator: string;
  operatorId: string;
  details: string;
  createdAt: Date;
  processedAt?: Date;
}

export interface TodoItem {
  id: string;
  type: TodoType;
  title: string;
  description?: string;
  assignee: string;
  assigneeId: string;
  status: Status;
  priority: Priority;
  dueDate: Date;
  complianceRecordId?: string;
}

export interface RiskAlert {
  id: string;
  reagentId: string;
  reagentName: string;
  userId: string;
  userName: string;
  riskType: string;
  riskLevel: HazardLevel;
  description: string;
  status: Status;
  resolution?: string;
  complianceRecordId?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface Experiment {
  id: string;
  userId: string;
  title: string;
  data: string;
  archivedAt: Date;
  complianceRecordId?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface FilterParams {
  status?: Status;
  startDate?: Date;
  endDate?: Date;
  operatorId?: string;
  type?: ComplianceType;
}

export type CellRenderData = {
  text: string;
  className?: string;
  type?: 'badge' | 'text';
};

export type ActionConfig = {
  type: 'actions';
};

export type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (item: T) => string | number | CellRenderData | ActionConfig | null | undefined;
  required?: boolean;
  className?: string;
};
