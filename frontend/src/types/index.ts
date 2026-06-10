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

export type ProjectStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface Customer {
  id: string
  name: string
  phone: string
  address: string
  email?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  projectNo: string
  name: string
  customerId: string
  customerName?: string
  status: ProjectStatus
  salesPerson?: string
  projectManager?: string
  totalPrice: number
  startDate?: string
  endDate?: string
  actualEndDate?: string
  address?: string
  remark?: string
  handler?: string
  handleTime?: string
  createdAt: string
  updatedAt: string
}

export type DesignPlanStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export interface DesignPlan {
  id: string
  projectId: string
  projectName?: string
  name: string
  description?: string
  designFile?: string
  estimatedPrice?: number
  status: DesignPlanStatus
  handler?: string
  handleTime?: string
  createdAt: string
  updatedAt: string
}

export type ContractStatus = 'draft' | 'signed' | 'terminated'

export interface Contract {
  id: string
  projectId: string
  projectName: string
  contractNo: string
  amount: number
  signDate: string
  partyA: string
  partyB: string
  description?: string
  status: ContractStatus
  handler: string
  handleTime: string
  createdAt: string
  updatedAt: string
}

export interface HouseSurvey {
  id: string
  projectId: string
  projectName?: string
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

export type StageStatus = 'pending' | 'in_progress' | 'completed' | 'delayed'

export interface ConstructionStage {
  id: string
  projectId: string
  projectName?: string
  name: string
  order: number
  startDate?: string
  endDate?: string
  actualStartDate?: string
  actualEndDate?: string
  status: StageStatus
  description?: string
  handler?: string
  handleTime?: string
  createdAt: string
  updatedAt: string
}

export interface StagePhoto {
  id: string
  stageId: string
  stageName?: string
  projectId: string
  title: string
  photoUrl: string
  description?: string
  uploader?: string
  uploadTime?: string
  createdAt: string
}

export type FeedbackStatus = 'pending' | 'processing' | 'resolved'

export type FeedbackType = 'quality' | 'schedule' | 'service' | 'other'

export interface CustomerFeedback {
  id: string
  projectId: string
  projectName?: string
  content: string
  type: FeedbackType
  feedbackTime?: string
  reply?: string
  replyTime?: string
  status: FeedbackStatus
  handler?: string
  createdAt: string
}

export type ReminderStatus = 'pending' | 'resolved'

export interface DelayReminder {
  id: string
  projectId: string
  projectName?: string
  stageId?: string
  stageName?: string
  reason?: string
  days: number
  remindTime?: string
  status: ReminderStatus
  handler?: string
  createdAt: string
}

export type InspectionStatus = 'pending' | 'in_progress' | 'completed'

export type InspectionResult = 'pass' | 'fail' | 'pending'

export interface InspectionTask {
  id: string
  projectId: string
  projectName?: string
  stageId?: string
  stageName?: string
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

export type AfterSalesStatus = 'pending' | 'processing' | 'resolved'

export type AfterSalesType = 'quality' | 'installation' | 'material' | 'other'

export interface AfterSales {
  id: string
  projectId: string
  projectName?: string
  title: string
  type: AfterSalesType
  description?: string
  reporter?: string
  reportTime?: string
  solution?: string
  cost?: number
  status: AfterSalesStatus
  handler?: string
  handleTime?: string
  createdAt: string
}

export interface MaterialCost {
  id: string
  projectId: string
  projectName?: string
  materialName: string
  specification?: string
  quantity: number
  unit?: string
  unitPrice: number
  totalPrice: number
  supplier?: string
  purchaseDate?: string
  handler?: string
  remark?: string
  createdAt: string
}

export type ProcessRecordType = 'design' | 'contract' | 'survey' | 'inspection' | 'aftersales' | 'construction'

export type ProcessRecordStatus = string

export interface ProcessRecord {
  id: string
  type: ProcessRecordType
  title: string
  handler: string
  handleTime: string
  status: ProcessRecordStatus
  projectId: string
  projectName: string
  description?: string
}

export interface MonthlySummary {
  month: string
  totalRevenue: number
  totalCost: number
  totalProfit: number
  projectCount: number
}

export interface ProjectSummary {
  projectId: string
  projectName: string
  totalRevenue: number
  materialCost: number
  laborCost: number
  otherCost: number
  totalCost: number
  profit: number
  profitMargin: number
}
