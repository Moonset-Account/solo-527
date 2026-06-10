export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export type ProjectStatus = 'PENDING' | 'DESIGNING' | 'CONSTRUCTING' | 'COMPLETED' | 'DELAYED'

export type DesignPlanStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

export type ContractStatus = 'DRAFT' | 'SIGNED' | 'TERMINATED'

export type ConstructionStageStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED'

export type FeedbackStatus = 'PENDING' | 'PROCESSED'

export type FeedbackType = 'COMPLAINT' | 'SUGGESTION' | 'PRAISE'

export type DelayReminderStatus = 'PENDING' | 'RESOLVED'

export type InspectionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'

export type InspectionResult = 'PASS' | 'FAIL'

export type AfterSalesStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CLOSED'

export type AfterSalesType = 'REPAIR' | 'MAINTENANCE' | 'CONSULT'

export type ProcessRecordType = 'DESIGN' | 'CONTRACT' | 'SURVEY' | 'INSPECTION' | 'AFTERSALES' | 'CONSTRUCTION'

export interface Customer {
  id: number
  name: string
  phone: string
  address?: string
  email?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: number
  projectNo: string
  name: string
  status: ProjectStatus
  totalPrice: number | string
  startDate: string
  endDate: string
  actualEndDate?: string
  customerId: number
  customer?: Customer
  salesPerson?: string
  projectManager?: string
  remark?: string
  handler?: string
  handleTime?: string
  createdAt: string
  updatedAt: string
}

export interface DesignPlan {
  id: number
  projectId: number
  name: string
  estimatedPrice?: number | string
  designFile?: string
  description?: string
  status: DesignPlanStatus
  handler?: string
  handleTime?: string
  createdAt: string
  updatedAt: string
}

export interface Contract {
  id: number
  projectId: number
  contractNo: string
  amount: number | string
  signDate: string
  partyA: string
  partyB: string
  description?: string
  status: ContractStatus
  handler?: string
  handleTime?: string
  createdAt: string
  updatedAt: string
}

export interface HouseSurvey {
  id: number
  projectId: number
  surveyDate?: string
  surveyor?: string
  area: number
  layout?: string
  floor?: number
  orientation?: string
  description?: string
  photos?: string[]
  handler?: string
  handleTime?: string
  createdAt: string
  updatedAt: string
}

export interface ConstructionStage {
  id: number
  projectId: number
  name: string
  order: number
  startDate?: string
  endDate?: string
  actualStartDate?: string
  actualEndDate?: string
  status: ConstructionStageStatus
  description?: string
  handler?: string
  handleTime?: string
  createdAt: string
  updatedAt: string
}

export interface StagePhoto {
  id: number
  projectId: number
  title: string
  description?: string
  photoUrl: string
  uploader?: string
  uploadTime?: string
  createdAt: string
}

export interface CustomerFeedback {
  id: number
  projectId: number
  content: string
  type: FeedbackType
  feedbackTime?: string
  reply?: string
  replyTime?: string
  status: FeedbackStatus
  handler?: string
  createdAt: string
}

export interface DelayReminder {
  id: number
  projectId: number
  stageId?: number
  reason?: string
  days: number
  remindTime?: string
  status: DelayReminderStatus
  handler?: string
  createdAt: string
}

export interface InspectionTask {
  id: number
  projectId: number
  stageId?: number
  title: string
  planDate?: string
  inspector?: string
  actualDate?: string
  result?: InspectionResult
  status: InspectionStatus
  issues?: string
  rectificationDeadline?: string
  handler?: string
  handleTime?: string
  createdAt: string
}

export interface AfterSales {
  id: number
  projectId: number
  title: string
  description?: string
  reportTime?: string
  reporter?: string
  type: AfterSalesType
  solution?: string
  cost?: number | string
  handler?: string
  handleTime?: string
  status: AfterSalesStatus
  createdAt: string
}

export interface MaterialCost {
  id: number
  projectId: number
  materialName: string
  specification?: string
  quantity: number
  unit?: string
  unitPrice: number | string
  totalPrice: number | string
  supplier?: string
  purchaseDate?: string
  handler?: string
  remark?: string
  createdAt: string
}

export interface ProcessRecord {
  id: number
  type: ProcessRecordType
  title: string
  handler: string
  handleTime: string
  status: string
  projectId: number
  description?: string
}

export interface MaterialCostReport {
  month?: string
  projectId?: number
  materials: MaterialCost[]
  totalAmount: number
}

export interface MonthlySummary {
  month: string
  totalProjects: number
  newProjects: number
  completedProjects: number
  totalContractAmount: number
  totalMaterialCost: number
  totalFeedbacks: number
  totalInspections: number
  totalAfterSales: number
  statusCounts: Record<string, number>
  projects: Array<{
    projectId: number
    projectName: string
    projectNo: string
    customerName?: string
    status: string
    totalPrice?: number
    materialCost: number
  }>
}

export interface ProjectSummary {
  project: Project
  summary: {
    designPlanCount: number
    contractCount: number
    houseSurveyCount: number
    constructionStageCount: number
    completedStageCount: number
    progress: number
    customerFeedbackCount: number
    afterSalesCount: number
    inspectionTaskCount: number
    delayReminderCount: number
    stagePhotoCount: number
    materialTotalCost: number
    totalContractAmount: number
  }
}
