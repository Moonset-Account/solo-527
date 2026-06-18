export interface PageResult<T> {
  total: number
  records: T[]
  pageNum: number
  pageSize: number
}

export interface BaseQuery {
  pageNum?: number
  pageSize?: number
  keyword?: string
  status?: string
  owner?: string
  source?: string
  legalOwner?: string
  startTime?: string
  endTime?: string
  errorReason?: string
}

export interface EmailTemplate {
  id: number
  name: string
  description: string
  subject: string
  content: string
  category: string
  source: string
  owner: string
  legalOwner: string
  version: number
  status: string
  isRisk: boolean
  riskReason: string
  createBy: string
  updateBy: string
  createTime: string
  updateTime: string
}

export interface EmailTemplateVersion {
  id: number
  templateId: number
  version: number
  name: string
  subject: string
  content: string
  changeLog: string
  createBy: string
  createTime: string
}

export interface BatchTask {
  id: number
  taskName: string
  description: string
  templateId: number
  templateName: string
  totalCount: number
  successCount: number
  failCount: number
  riskCount: number
  status: string
  source: string
  owner: string
  legalOwner: string
  scheduleTime: string
  startTime: string
  endTime: string
  dataSource: string
  createBy: string
  updateBy: string
  createTime: string
  updateTime: string
}

export interface EmailRecord {
  id: number
  taskId: number
  taskName: string
  templateId: number
  templateName: string
  recipientEmail: string
  recipientName: string
  subject: string
  content: string
  status: string
  isRisk: boolean
  riskReason: string
  source: string
  owner: string
  legalOwner: string
  errorMessage: string
  variables: string
  version: number
  changeLog: string
  createBy: string
  createTime: string
  generateTime: string
}

export interface EmailRecordVersion {
  id: number
  recordId: number
  version: number
  subject: string
  content: string
  recipientEmail: string
  recipientName: string
  changeLog: string
  createBy: string
  createTime: string
}

export interface CallLog {
  id: number
  requestId: string
  apiName: string
  method: string
  requestParams: string
  responseData: string
  status: string
  errorMessage: string
  errorCode: string
  costTime: number
  source: string
  owner: string
  legalOwner: string
  taskId: number
  templateId: number
  createBy: string
  clientIp: string
  createTime: string
}

export interface RiskSample {
  id: number
  recordId: number
  taskId: number
  taskName: string
  templateId: number
  templateName: string
  subject: string
  content: string
  riskType: string
  riskDescription: string
  riskLevel: string
  source: string
  owner: string
  legalOwner: string
  reviewStatus: string
  reviewComment: string
  reviewBy: string
  reviewTime: string
  createBy: string
  createTime: string
  updateTime: string
}
