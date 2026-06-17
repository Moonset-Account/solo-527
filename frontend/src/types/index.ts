export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: string
  path?: string
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginatedResponse<T> {
  list: T[]
  total: number
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  REAGENT_MANAGER = 'reagent_manager',
  LAB_MANAGER = 'lab_manager',
  RESEARCHER = 'researcher',
  USER = 'user',
}

export interface User {
  _id: string
  username: string
  realName: string
  email?: string
  phone?: string
  department?: string
  laboratory?: string
  position?: string
  roles: UserRole[]
  isActive: boolean
  avatar?: string
  lastLoginAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: string | number
  user: User
}

export enum ApplicationStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PICKED = 'picked',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export const ApplicationStatusLabel: Record<ApplicationStatus, string> = {
  [ApplicationStatus.DRAFT]: '草稿',
  [ApplicationStatus.PENDING]: '待审核',
  [ApplicationStatus.APPROVED]: '已通过',
  [ApplicationStatus.REJECTED]: '已驳回',
  [ApplicationStatus.PICKED]: '已领取',
  [ApplicationStatus.RETURNED]: '已归还',
  [ApplicationStatus.CANCELLED]: '已取消',
  [ApplicationStatus.COMPLETED]: '已完成',
}

export const ApplicationStatusType: Record<ApplicationStatus, string> = {
  [ApplicationStatus.DRAFT]: 'info',
  [ApplicationStatus.PENDING]: 'warning',
  [ApplicationStatus.APPROVED]: 'success',
  [ApplicationStatus.REJECTED]: 'danger',
  [ApplicationStatus.PICKED]: 'primary',
  [ApplicationStatus.RETURNED]: 'success',
  [ApplicationStatus.CANCELLED]: 'info',
  [ApplicationStatus.COMPLETED]: 'success',
}

export interface ApplicationItem {
  reagentId: string
  reagentName: string
  reagentBatchNo?: string
  specification?: string
  quantity: number
  unit: string
  actualQuantity?: number
  remarks?: string
}

export interface Application {
  _id: string
  applicationNo: string
  type: string
  status: ApplicationStatus
  applicantId: string
  applicantName: string
  applicantDepartment?: string
  applicantLaboratory?: string
  projectId?: string
  projectName?: string
  items: ApplicationItem[]
  purpose: string
  expectedPickDate?: string
  pickLocation?: string
  contactPhone?: string
  approval?: {
    approverId: string
    approverName: string
    approvedAt: string
    remark?: string
  }
  rejectReason?: string
  pickedAt?: string
  pickedBy?: string
  pickedByName?: string
  relatedInstrumentBookingId?: string
  relatedHazardousLabelIds?: string[]
  relatedSampleIds?: string[]
  originalDocumentId?: string
  remarks?: string
  createdAt: string
  updatedAt: string
}

export interface Reagent {
  _id: string
  name: string
  nameEn?: string
  casNo?: string
  molecularFormula?: string
  molecularWeight?: number
  category: string
  purity?: string
  manufacturer?: string
  batchNo?: string
  unit: string
  totalQuantity: number
  availableQuantity: number
  warningThreshold: number
  productionDate?: string
  expiryDate: string
  specification?: string
  grade?: string
  isHazardous: boolean
  hazardousCategory?: string
  hazardLabels: string[]
  storage?: {
    location?: string
    cabinet?: string
    temperature?: number
    storageCondition?: string
  }
  safetyDataSheet?: string
  remarks?: string
  tags: string[]
  relatedProjects?: string[]
  originalDocumentId?: string
  isActive: boolean
  createdAt: string
}

export enum InstrumentStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  BROKEN = 'broken',
}

export const InstrumentStatusLabel: Record<InstrumentStatus, string> = {
  [InstrumentStatus.AVAILABLE]: '可用',
  [InstrumentStatus.BOOKED]: '已预约',
  [InstrumentStatus.IN_USE]: '使用中',
  [InstrumentStatus.MAINTENANCE]: '维护中',
  [InstrumentStatus.BROKEN]: '故障',
}

export interface Instrument {
  _id: string
  instrumentNo: string
  name: string
  model?: string
  manufacturer?: string
  status: InstrumentStatus
  location?: string
  laboratory?: string
  managerId?: string
  managerName?: string
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  tags: string[]
  description?: string
  isActive: boolean
}

export interface InstrumentBooking {
  _id: string
  bookingNo: string
  instrumentId: string
  instrumentName: string
  bookerId: string
  bookerName: string
  startTime: string
  endTime: string
  purpose: string
  projectId?: string
  relatedApplicationIds: string[]
  status: string
  remarks?: string
}

export enum SampleStatus {
  STORAGE = 'storage',
  IN_USE = 'in_use',
  TRANSFERRED = 'transferred',
  DESTROYED = 'destroyed',
  UNKNOWN = 'unknown',
  ARCHIVED = 'archived',
}

export const SampleStatusLabel: Record<SampleStatus, string> = {
  [SampleStatus.STORAGE]: '存储中',
  [SampleStatus.IN_USE]: '使用中',
  [SampleStatus.TRANSFERRED]: '已转移',
  [SampleStatus.DESTROYED]: '已销毁',
  [SampleStatus.UNKNOWN]: '去向不明',
  [SampleStatus.ARCHIVED]: '已归档',
}

export interface Sample {
  _id: string
  sampleCode: string
  name: string
  type?: string
  source?: string
  storageLocation?: string
  quantity?: number
  unit?: string
  status: SampleStatus
  projectId?: string
  relatedReagentId?: string
  relatedApplicationIds: string[]
  originalDocumentId?: string
  currentHolderId?: string
  currentHolderName?: string
  lastCheckedAt?: string
  remarks?: string
  isActive: boolean
}

export enum NotificationType {
  APPLICATION_SUBMITTED = 'application_submitted',
  APPLICATION_APPROVED = 'application_approved',
  APPLICATION_REJECTED = 'application_rejected',
  SAFETY_COMPLIANCE = 'safety_compliance',
  SAMPLE_UNKNOWN = 'sample_unknown',
  MAINTENANCE_ALERT = 'maintenance_alert',
  SYSTEM_NOTICE = 'system_notice',
}

export const NotificationTypeLabel: Record<NotificationType, string> = {
  [NotificationType.APPLICATION_SUBMITTED]: '申请提交',
  [NotificationType.APPLICATION_APPROVED]: '申请通过',
  [NotificationType.APPLICATION_REJECTED]: '申请驳回',
  [NotificationType.SAFETY_COMPLIANCE]: '安全合规',
  [NotificationType.SAMPLE_UNKNOWN]: '样本去向不明',
  [NotificationType.MAINTENANCE_ALERT]: '维保提醒',
  [NotificationType.SYSTEM_NOTICE]: '系统通知',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface Notification {
  _id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  content: string
  recipientIds: string[]
  readBy: string[]
  confirmedBy: string[]
  payload?: Record<string, any>
  relatedModule?: string
  relatedId?: string
  needConfirmation: boolean
  syncedToDashboardAt?: string
  createdAt: string
}

export interface DictionaryItem {
  value: string
  label: string
  sort: number
  enabled: boolean
  extra?: Record<string, any>
}

export interface Dictionary {
  _id: string
  type: string
  code: string
  name: string
  description?: string
  items: DictionaryItem[]
  scope: string[]
  enabled: boolean
}

export interface Project {
  _id: string
  projectNo: string
  name: string
  description?: string
  principalInvestigatorId?: string
  principalInvestigatorName?: string
  memberIds: string[]
  department?: string
  fundingSource?: string
  fundingAmount?: number
  startDate?: string
  endDate?: string
  status: string
  isActive: boolean
}

export interface OriginalDocument {
  _id: string
  documentNo: string
  title: string
  documentType?: string
  source?: string
  documentDate?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  relatedReagentIds: string[]
  relatedApplicationIds: string[]
  relatedSampleIds: string[]
  relatedProjectIds: string[]
  description?: string
  uploadedBy?: string
  uploadedByName?: string
  isActive: boolean
  createdAt: string
}

export interface AuditLog {
  _id: string
  action: string
  module: string
  targetId: string
  targetName?: string
  operatorId?: string
  operatorName?: string
  details?: Record<string, any>
  remark?: string
  actionTime: string
  createdAt: string
}
