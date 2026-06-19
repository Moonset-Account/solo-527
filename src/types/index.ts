export type UserRole = 'RESEARCHER' | 'ADMIN' | 'DEVICE_TEACHER' | 'PRINCIPAL';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface HazardLabel {
  id: string;
  code: string;
  name: string;
  description: string;
  iconClass: string;
  precautionaryMeasures: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reagent {
  id: string;
  name: string;
  casNo: string;
  batchNo: string;
  specification: string;
  totalQuantity: number;
  usedQuantity: number;
  unit: string;
  hazardLabels: HazardLabel[];
  expireDate: string;
  storageLocation: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export type ApplicationStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SCHEDULED' | 'COMPLETED';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface RequisitionApplication {
  id: string;
  applicantId: string;
  applicantName: string;
  reagentId: string;
  reagentName: string;
  quantity: number;
  purpose: string;
  experimentName: string;
  scheduledDate: string;
  status: ApplicationStatus;
  attachments: Attachment[];
  auditLog: AuditLog[];
  createdAt: string;
  updatedAt: string;
  rejectReason?: string;
}

export type ScheduleStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ConflictStatus = 'NONE' | 'PENDING' | 'RESOLVED';

export interface Schedule {
  id: string;
  applicationId: string;
  reagentId: string;
  reagentName: string;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  conflictStatus: ConflictStatus;
  deviceTeacherId?: string;
  deviceTeacherName?: string;
  principalConfirmed: boolean;
  applicantName?: string;
  createdAt: string;
  createdBy: string;
}

export type ConflictType = 'INVENTORY' | 'TIME_OVERLAP' | 'DEVICE';
export type ConflictSeverity = 'WARNING' | 'CRITICAL';
export type ConflictResolutionStatus = 'OPEN' | 'RESOLVED';

export interface ScheduleConflict {
  id: string;
  scheduleId1: string;
  scheduleId2: string;
  schedule1Info?: Schedule;
  schedule2Info?: Schedule;
  type: ConflictType;
  severity: ConflictSeverity;
  status: ConflictResolutionStatus;
  resolvedBy?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  resolution?: string;
  createdAt: string;
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  oldValue?: string;
  newValue?: string;
  operatorId: string;
  operatorName: string;
  timestamp: string;
}

export type NotificationType = 'APPLICATION' | 'SCHEDULE' | 'CONFLICT' | 'COMPLIANCE' | 'SYSTEM';
export type NotificationStatus = 'UNREAD' | 'READ';
export type DeliveryStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  status: NotificationStatus;
  deliveryStatus: DeliveryStatus;
  failureReason?: string;
  retryCount: number;
  createdAt: string;
  readAt?: string;
}

export interface MaintenanceConfig {
  id: string;
  deviceName: string;
  problemTemplate: string;
  solutionTemplate: string;
  maintenanceCycleDays: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate: string;
  updatedBy: string;
  updatedByName: string;
  updatedAt: string;
}

export type SampleStatus = 'PENDING' | 'PROCESSING' | 'ANALYZING' | 'COMPLETED' | 'ARCHIVED';

export interface TraceLog {
  id: string;
  status: string;
  location: string;
  operatorId: string;
  operatorName: string;
  timestamp: string;
  remark?: string;
}

export interface SampleTracking {
  id: string;
  sampleNo: string;
  experimentName: string;
  applicationId: string;
  reagentId: string;
  reagentName: string;
  status: SampleStatus;
  currentLocation: string;
  operatorId: string;
  operatorName: string;
  traceLog: TraceLog[];
  createdAt: string;
}

export type CheckType = 'EXPIRATION' | 'STORAGE' | 'USAGE' | 'DOCUMENT';
export type ComplianceStatusType = 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';

export interface ComplianceCheck {
  id: string;
  reagentId: string;
  reagentName: string;
  checkType: CheckType;
  status: ComplianceStatusType;
  description: string;
  checkedAt: string;
}

export interface ComplianceDashboard {
  overallComplianceRate: number;
  expiringSoon: number;
  nonCompliantItems: ComplianceCheck[];
  hazardousCount: number;
  totalReagents: number;
}

export interface PageResult<T> {
  content: T[];
  total: number;
  page: number;
  size: number;
}

export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  render?: (item: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

export interface ConflictCheckRequest {
  reagentId: string;
  startTime: string;
  endTime: string;
  excludeScheduleId?: string;
}

export interface ConflictCheckResponse {
  hasConflict: boolean;
  conflicts: ScheduleConflict[];
}

export interface DashboardStats {
  totalReagents: number;
  pendingApplications: number;
  todaySchedules: number;
  safetyAlerts: number;
  pendingConflicts: number;
  expiringReagents: number;
}

export interface TodoItem {
  id: string;
  type: 'APPLICATION' | 'CONFLICT' | 'CONFIRM' | 'COMPLIANCE';
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
  relatedId: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'REAGENT' | 'APPLICATION' | 'SAMPLE' | 'EXPERIMENT';
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface RelationGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
