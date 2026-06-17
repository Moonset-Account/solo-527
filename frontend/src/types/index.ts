export type Role = 'admin' | 'manager' | 'customer_service';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type ConfigStatus = 'enabled' | 'disabled' | 'draft';

export interface User {
  _id: string;
  username: string;
  email: string;
  realName: string;
  role: Role;
  status: UserStatus;
  phone?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: User;
  updatedBy?: User;
}

export type BillType = 'rent' | 'water' | 'electricity' | 'gas' | 'network' | 'property' | 'other';
export type BillStatus = 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export interface Bill {
  _id: string;
  billNo: string;
  type: BillType;
  roomNo: string;
  residentName: string;
  residentPhone?: string;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  billingPeriod: string;
  dueDate: string;
  status: BillStatus;
  paymentRecords: Array<{ date: string; amount: number; paidBy?: User; method: string; remark?: string }>;
  remark?: string;
  createdBy?: User;
  updatedBy?: User;
  createdAt: string;
  updatedAt: string;
}

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface Maintenance {
  _id: string;
  orderNo: string;
  title: string;
  description: string;
  location: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reporterName?: string;
  reporterPhone?: string;
  assignee?: User;
  handleLogs: Array<{ date: string; content: string; operator?: User }>;
  completedAt?: string;
  configStatus: ConfigStatus;
  createdBy?: User;
  updatedBy?: User;
  createdAt: string;
  updatedAt: string;
}

export type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'exception';

export interface Inspection {
  _id: string;
  taskNo: string;
  title: string;
  area: string;
  scheduledAt: string;
  inspector?: User;
  status: InspectionStatus;
  checkItems: Array<{ item: string; result: string; remark?: string; checkedAt?: string }>;
  conclusion?: string;
  completedAt?: string;
  configStatus: ConfigStatus;
  createdBy?: User;
  updatedBy?: User;
  createdAt: string;
  updatedAt: string;
}

export type RoomStatus = 'occupied' | 'vacant' | 'maintenance' | 'reserved';
export type RoomType = 'studio' | 'one_bed' | 'two_bed' | 'three_bed' | 'deluxe';

export interface RoomPricing {
  _id: string;
  roomNo: string;
  roomType: RoomType;
  floor: number;
  area: number;
  status: RoomStatus;
  monthlyRent: number;
  deposit?: number;
  waterRate?: number;
  electricityRate?: number;
  managementFee?: number;
  description?: string;
  configStatus: ConfigStatus;
  createdBy?: User;
  updatedBy?: User;
  createdAt: string;
  updatedAt: string;
}

export type ExceptionType = 'access_denied' | 'tailgating' | 'invalid_card' | 'after_hours' | 'stranger' | 'other';
export type ExceptionSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ExceptionStatus = 'open' | 'handling' | 'resolved' | 'closed';

export interface AccessException {
  _id: string;
  recordNo: string;
  type: ExceptionType;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  occurrenceTime: string;
  location: string;
  deviceId?: string;
  personName?: string;
  personCardNo?: string;
  impactScope: string;
  description: string;
  currentOwner?: User;
  processLogs: Array<{ date: string; content: string; handler?: User; status?: string }>;
  resolution?: string;
  resolvedAt?: string;
  configStatus: ConfigStatus;
  createdBy?: User;
  updatedBy?: User;
  createdAt: string;
  updatedAt: string;
}

export type ConfigCategory = 'billing' | 'maintenance' | 'inspection' | 'pricing' | 'access' | 'system';

export interface ConfigItem {
  _id: string;
  key: string;
  name: string;
  category: ConfigCategory;
  value?: any;
  defaultValue?: any;
  description?: string;
  changeLogs: Array<{ date: string; from: any; to: any; operator?: User }>;
  status: ConfigStatus;
  createdBy?: User;
  updatedBy?: User;
  createdAt: string;
  updatedAt: string;
}
