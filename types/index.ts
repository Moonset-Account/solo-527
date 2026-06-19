export type UserRole = 'owner' | 'manager' | 'inspector' | 'customer_service'

export interface User {
  id: string
  name: string
  email?: string | null
  phone: string
  role: UserRole
  avatar?: string | null
  createdAt: string
  updatedAt: string
}

export type ProjectStatus = 'draft' | 'quoting' | 'in_progress' | 'completed' | 'cancelled'

export interface Project {
  id: string
  name: string
  ownerId: string
  ownerName: string
  status: ProjectStatus
  currentBudgetVersionId: string | null
  currentBudgetVersion?: BudgetVersion | null
  startDate: string | null
  endDate: string | null
  description?: string | null
  attachments: Attachment[]
  inspectionCount?: number
  latestInspection?: Inspection | null
  isDelayed?: boolean
  createdAt: string
  updatedAt: string
}

export type BudgetStatus = 'draft' | 'pending_confirm' | 'confirmed' | 'rejected'

export interface BudgetVersion {
  id: string
  projectId: string
  version: number
  totalAmount: number
  changeAmount: number
  changeReason?: string | null
  status: BudgetStatus
  confirmedAt: string | null
  confirmedBy: string | null
  confirmerName?: string | null
  createdBy: string
  creatorName?: string
  items: BudgetItem[]
  snapshot?: any
  createdAt: string
}

export interface BudgetItem {
  id: string
  budgetVersionId: string
  name: string
  category: string
  unit: string
  quantity: number
  unitPrice: number
  amount: number
  remark?: string | null
}

export type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'rectifying'

export interface Inspection {
  id: string
  projectId: string
  projectName?: string
  title: string
  inspectorId: string
  inspectorName: string
  status: InspectionStatus
  scheduledAt: string
  completedAt: string | null
  budgetVersionId: string | null
  remark?: string | null
  photos: InspectionPhoto[]
  rectifications: Rectification[]
  feedback?: InspectionFeedback | null
  createdAt: string
}

export interface InspectionPhoto {
  id: string
  inspectionId: string
  url: string
  category: string
  description?: string | null
  uploadedAt: string
}

export type RectificationStatus = 'pending' | 'processing' | 'completed' | 'rechecked'

export interface Rectification {
  id: string
  inspectionId: string
  title: string
  description: string
  responsiblePerson: string
  deadline: string
  status: RectificationStatus
  photos?: string[] | null
  createdAt: string
  completedAt?: string | null
}

export type FeedbackConclusion = 'pass' | 'pass_with_rectification' | 'fail'

export interface InspectionFeedback {
  id: string
  inspectionId: string
  conclusion: FeedbackConclusion
  remark?: string | null
  confirmedBy: string
  confirmerName?: string
  confirmedAt: string
  beforePhotos?: string[] | null
  afterPhotos?: string[] | null
}

export interface Attachment {
  id: string
  projectId: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: string
}

export type NotificationType = 'budget_change' | 'delay_warning' | 'rectification_due' | 'inspection_assigned'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  content: string
  relatedId?: string | null
  read: boolean
  createdAt: string
}

export type BatchOperationType = 'assign_inspection' | 'update_status' | 'notify_owner'

export type BatchOperationStatus = 'preview' | 'executing' | 'completed' | 'partial_failed'

export interface BatchOperation {
  id: string
  type: BatchOperationType
  status: BatchOperationStatus
  totalCount: number
  successCount: number
  failedCount: number
  targetIds: string[]
  failedRecords: FailedRecord[]
  operatorId: string
  operatorName?: string
  createdAt: string
  completedAt: string | null
}

export interface FailedRecord {
  id: string
  batchOperationId: string
  targetId: string
  targetName: string
  errorMessage: string
  assignee: string
  assigneeName?: string
  resolved: boolean
  resolvedAt?: string | null
  createdAt: string
}

export interface MonthlyReport {
  month: string
  totalProjects: number
  completedProjects: number
  delayedProjects: number
  totalBudgetChange: number
  closureRate: number
  avgRectificationDays: number
}

export interface ClosureReport {
  totalInspections: number
  completedInspections: number
  totalRectifications: number
  completedRectifications: number
  closureRate: number
  avgClosureDays: number
  delayedCount: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface BudgetCompareResult {
  fromVersion: BudgetVersion
  toVersion: BudgetVersion
  addedItems: BudgetItem[]
  removedItems: BudgetItem[]
  changedItems: Array<{
    field: string
    oldValue: any
    newValue: any
  }>
  totalChange: number
}
