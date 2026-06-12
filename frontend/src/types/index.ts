export type RoleCode = 'ADMIN' | 'FINANCE_MANAGER' | 'APPROVER' | 'APPLICANT'

export type ApplicationStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'

export type ApprovalAction = 'APPROVE' | 'REJECT' | 'RETURN'

export interface User {
  id: number
  username: string
  realName: string
  email: string
  phone: string
  department: string
  roles: RoleCode[]
  createdAt?: string
  updatedAt?: string
}

export interface ExpenseAttachment {
  id: number
  applicationId: number
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
  uploadedBy: number
  uploadedAt: string
}

export interface ApprovalNode {
  id: number
  ruleId: number
  nodeName: string
  nodeOrder: number
  approverRole: RoleCode
  approverId?: number
  timeoutHours: number
  createdAt?: string
  updatedAt?: string
}

export interface ApprovalRule {
  id: number
  ruleName: string
  department: string
  minAmount: number
  maxAmount: number
  nodes: ApprovalNode[]
  enabled: boolean
  createdBy: number
  createdAt: string
  updatedAt?: string
}

export interface ApprovalRecord {
  id: number
  applicationId: number
  nodeId: number
  nodeName: string
  approverId: number
  approverName: string
  action: ApprovalAction
  comment: string
  approvedAt: string
  createdAt?: string
}

export interface ApprovalConfig {
  id: number
  configKey: string
  configValue: string
  description: string
  createdAt?: string
  updatedAt?: string
}

export interface ExpenseApplication {
  id: number
  applicationNo: string
  applicantId: number
  applicantName: string
  department: string
  title: string
  description: string
  amount: number
  expenseType: string
  status: ApplicationStatus
  currentNodeId?: number
  currentNodeName?: string
  attachments: ExpenseAttachment[]
  approvalRecords: ApprovalRecord[]
  createdAt: string
  submittedAt?: string
  approvedAt?: string
  rejectedAt?: string
  updatedAt?: string
}

export interface ChangeLog {
  id: number
  applicationId: number
  operatorId: number
  operatorName: string
  action: string
  fieldName: string
  oldValue: string
  newValue: string
  operatedAt: string
}

export interface TimeoutException {
  id: number
  applicationId: number
  applicationNo: string
  nodeId: number
  nodeName: string
  approverId: number
  approverName: string
  timeoutHours: number
  handled: boolean
  handledBy?: number
  handledAt?: string
  createdAt: string
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PageParams {
  page: number
  pageSize: number
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  refreshToken: string
  user: User
  expiresIn: number
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  token: string
  refreshToken: string
  expiresIn: number
}

export interface CreateApplicationRequest {
  title: string
  description: string
  amount: number
  expenseType: string
}

export interface SubmitApplicationRequest {
  id: number
}

export interface ApprovalRequest {
  applicationId: number
  comment: string
}

export interface CreateRuleRequest {
  ruleName: string
  department: string
  minAmount: number
  maxAmount: number
  nodes: Omit<ApprovalNode, 'id' | 'ruleId' | 'createdAt' | 'updatedAt'>[]
}

export interface UpdateRuleRequest extends Partial<CreateRuleRequest> {
  id: number
  enabled?: boolean
}

export interface CreateConfigRequest {
  configKey: string
  configValue: string
  description: string
}

export interface UpdateConfigRequest extends Partial<CreateConfigRequest> {
  id: number
}

export interface CreateUserRequest {
  username: string
  password: string
  realName: string
  email: string
  phone: string
  department: string
  roles: RoleCode[]
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
  id: number
  password?: string
}

export interface AssignRolesRequest {
  userId: number
  roles: RoleCode[]
}

export interface HandleTimeoutRequest {
  timeoutId: number
  action: 'TRANSFER' | 'APPROVE' | 'REJECT'
  targetApproverId?: number
  comment?: string
}
