export enum UserRole {
  StoreOperator = 1,
  Admin = 2,
}

export enum AlertStatus {
  Pending = 1,
  Assigned = 2,
  Processing = 3,
  Resolved = 4,
  Closed = 5,
  Rollback = 6,
}

export enum AlertPriority {
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4,
}

export enum AlertType {
  ServerDown = 1,
  HighCpu = 2,
  HighMemory = 3,
  DiskFull = 4,
  NetworkIssue = 5,
  SecurityVulnerability = 6,
  ApplicationError = 7,
  DatabaseIssue = 8,
}

export enum AssetType {
  Server = 1,
  NetworkDevice = 2,
  Database = 3,
  Application = 4,
  Storage = 5,
}

export enum AssetStatus {
  Active = 1,
  Maintenance = 2,
  Offline = 3,
  Decommissioned = 4,
}

export enum BatchTaskStatus {
  Pending = 1,
  Running = 2,
  Completed = 3,
  PartiallyFailed = 4,
  Failed = 5,
  Cancelled = 6,
}

export enum BatchTaskType {
  BulkAssignAlert = 1,
  BulkCloseAlert = 2,
  BulkAssetSync = 3,
  BulkVulnerabilityScan = 4,
}

export enum NotificationType {
  AlertCreated = 1,
  AlertAssigned = 2,
  AlertStatusChanged = 3,
  AlertOverdue = 4,
  AssetSyncRequired = 5,
  VulnerabilityExpired = 6,
  BatchTaskCompleted = 7,
}

export enum AuditActionType {
  Create = 1,
  Update = 2,
  Delete = 3,
  Assign = 4,
  StatusChange = 5,
  Close = 6,
  Rollback = 7,
  VulnerabilityExtend = 8,
  AssetSync = 9,
  Login = 10,
  Logout = 11,
}

export interface User {
  id: number;
  userName: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Alert {
  id: number;
  title: string;
  description: string;
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  assetId?: number | null;
  assetName?: string | null;
  assignedToId?: number | null;
  assignedToName?: string | null;
  createdById: number;
  createdByName: string;
  createdAt: string;
  assignedAt?: string | null;
  startedAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  dueDate?: string | null;
  isOverdue: boolean;
  rollbackPlan?: string | null;
}

export interface AlertProcessLog {
  id: number;
  alertId: number;
  operatorId: number;
  operatorName: string;
  fromStatus: AlertStatus;
  toStatus: AlertStatus;
  actionDescription: string;
  remark?: string | null;
  createdAt: string;
}

export interface Asset {
  id: number;
  assetCode: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  ipAddress: string;
  location?: string | null;
  description?: string | null;
  configuration?: string | null;
  responsibleId?: number | null;
  responsibleName?: string | null;
  createdAt: string;
  lastSyncAt?: string | null;
  syncRequired: boolean;
}

export interface BatchTask {
  id: number;
  taskName: string;
  taskType: BatchTaskType;
  status: BatchTaskStatus;
  creatorId: number;
  creatorName: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  currentIndex: number;
  progressPercent: number;
  resultSummary?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface BatchTaskItem {
  id: number;
  itemIndex: number;
  itemKey: string;
  itemData?: string | null;
  success: boolean;
  errorMessage?: string | null;
  resultData?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface BatchTaskDetail extends BatchTask {
  items: BatchTaskItem[];
}

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  content: string;
  relatedId?: string | null;
  relatedType?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId: number;
  userName: string;
  userRole: UserRole;
  actionType: AuditActionType;
  entityType: string;
  entityId?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  remark?: string | null;
  ipAddress: string;
  createdAt: string;
}

export interface Vulnerability {
  id: number;
  name: string;
  cveId: string;
  description: string;
  severity: AlertPriority;
  assetId?: number | null;
  assetName?: string | null;
  discoveredAt: string;
  dueDate: string;
  resolvedAt?: string | null;
  isOverdue: boolean;
  extendCount: number;
  remediationPlan?: string | null;
}

export interface ApiResult<T = any> {
  success: boolean;
  message: string;
  code: number;
  data?: T;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresAt: string;
}

export interface CreateAlertRequest {
  title: string;
  description: string;
  type: AlertType;
  priority: AlertPriority;
  assetId?: number | null;
  dueDate?: string | null;
}

export interface AssignAlertRequest {
  assignedToId: number;
  priority: AlertPriority;
  remark?: string;
}

export interface ProcessAlertRequest {
  toStatus: AlertStatus;
  remark: string;
  rollbackPlan?: string;
}

export interface AlertQueryParams {
  page?: number;
  pageSize?: number;
  status?: AlertStatus;
  priority?: AlertPriority;
  type?: AlertType;
  assignedToId?: number;
  assetId?: number;
  keyword?: string;
  isOverdue?: boolean;
  startDate?: string;
  endDate?: string;
}
