
export enum SessionStatus {
  Draft = 0,
  Published = 1,
  Ongoing = 2,
  Ended = 3,
  Cancelled = 4
}

export enum SeatStatus {
  Available = 0,
  Reserved = 1,
  Sold = 2,
  Locked = 3,
  Maintenance = 4
}

export enum TicketType {
  Standard = 0,
  VIP = 1,
  VVIP = 2,
  Speaker = 3,
  Media = 4,
  Sponsor = 5
}

export enum RegistrationStatus {
  Pending = 0,
  Reviewing = 1,
  Approved = 2,
  Rejected = 3,
  Cancelled = 4,
  Completed = 5
}

export enum RegistrationSource {
  Online = 0,
  Offline = 1,
  Invitation = 2,
  Partner = 3
}

export enum TodoStatus {
  Pending = 0,
  Processing = 1,
  Completed = 2,
  Cancelled = 3
}

export enum TodoPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Urgent = 3
}

export enum ApiRetryStatus {
  Failed = 0,
  Retrying = 1,
  Success = 2,
  MaxRetriesExceeded = 3
}

export enum AuditAction {
  Create = 0,
  Update = 1,
  Delete = 2,
  Approve = 3,
  Reject = 4,
  Cancel = 5,
  Export = 6,
  Retry = 7,
  Login = 8
}

export interface Session {
  id: string;
  name: string;
  description?: string;
  venue?: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  groupNumber?: number;
  sortOrder: number;
  createdAt: string;
  seatCount: number;
  soldSeatCount: number;
}

export interface Seat {
  id: string;
  sessionId: string;
  seatCode: string;
  row?: string;
  number?: number;
  area?: string;
  status: SeatStatus;
  ticketType: TicketType;
  registrationId?: string;
  registrationName?: string;
  sortOrder: number;
}

export interface TicketStock {
  id: string;
  sessionId: string;
  ticketType: TicketType;
  ticketTypeName: string;
  totalQuantity: number;
  reservedQuantity: number;
  soldQuantity: number;
  availableQuantity: number;
  price?: number;
  description?: string;
}

export interface Registration {
  id: string;
  registrationNo: string;
  sessionId?: string;
  sessionName?: string;
  ticketType?: TicketType;
  seatId?: string;
  status: RegistrationStatus;
  source: RegistrationSource;
  name: string;
  company?: string;
  position?: string;
  phone?: string;
  email?: string;
  idCard?: string;
  wechat?: string;
  industry?: string;
  city?: string;
  groupNumber?: number;
  remark?: string;
  dataQualityScore: number;
  missingFields?: string;
  hasMissingData: boolean;
  reviewer?: string;
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RegistrationAudit {
  id: string;
  registrationId: string;
  fromStatus: RegistrationStatus;
  toStatus: RegistrationStatus;
  comment?: string;
  operator: string;
  operatedAt: string;
  changedFields?: string;
}

export interface PagedResult<T> {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  items: T[];
  totalPages: number;
}

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  priority: TodoPriority;
  status: TodoStatus;
  relatedType?: string;
  relatedId?: string;
  missingFields?: string;
  affectsInventory: boolean;
  assignedTo?: string;
  dueDate?: string;
  resolver?: string;
  resolvedAt?: string;
  resolution?: string;
  createdAt: string;
}

export interface OperationLog {
  id: string;
  action: AuditAction;
  actionName: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  operator: string;
  operatorRole?: string;
  operatedAt: string;
  ipAddress?: string;
  changedFields?: string;
  isSuccess: boolean;
  errorMessage?: string;
}

export interface ApiRetryRecord {
  id: string;
  apiName: string;
  httpMethod: string;
  requestUrl: string;
  requestBody?: string;
  responseBody?: string;
  statusCode: number;
  errorMessage?: string;
  retryStatus: ApiRetryStatus;
  retryCount: number;
  maxRetryCount: number;
  nextRetryAt?: string;
  lastRetriedAt?: string;
  succeededAt?: string;
  correlationId?: string;
  createdAt: string;
}

export interface InventoryOccupancy {
  sessionId: string;
  sessionName: string;
  ticketType: TicketType;
  ticketTypeName: string;
  totalCapacity: number;
  approvedOccupancy: number;
  pendingReviewOccupancy: number;
  missingDataOccupancy: number;
  reservedOccupancy: number;
  occupiedTotal: number;
  availableCount: number;
  occupancyRate: number;
  updatedAt: string;
}

export interface DashboardStats {
  totalRegistrations: number;
  pendingReviewCount: number;
  approvedCount: number;
  missingDataCount: number;
  todoCount: number;
  sessionsCount: number;
  totalSeats: number;
  soldSeats: number;
  failedApiCount: number;
  seatOccupancyRate: number;
  inventoryBySession: InventoryOccupancy[];
  recentRegistrations: Registration[];
  recentTodos: TodoItem[];
}

export const TICKET_TYPE_LABEL: Record<TicketType, string> = {
  [TicketType.Standard]: '标准票',
  [TicketType.VIP]: 'VIP票',
  [TicketType.VVIP]: 'VVIP票',
  [TicketType.Speaker]: '讲者票',
  [TicketType.Media]: '媒体票',
  [TicketType.Sponsor]: '赞助商票'
}

export const REG_STATUS_LABEL: Record<RegistrationStatus, { text: string; color: string }> = {
  [RegistrationStatus.Pending]: { text: '待提交', color: 'default' },
  [RegistrationStatus.Reviewing]: { text: '审核中', color: 'processing' },
  [RegistrationStatus.Approved]: { text: '已通过', color: 'success' },
  [RegistrationStatus.Rejected]: { text: '已拒绝', color: 'error' },
  [RegistrationStatus.Cancelled]: { text: '已取消', color: 'default' },
  [RegistrationStatus.Completed]: { text: '已完成', color: 'success' }
}

export const SEAT_STATUS_LABEL: Record<SeatStatus, { text: string; color: string }> = {
  [SeatStatus.Available]: { text: '可售', color: 'success' },
  [SeatStatus.Reserved]: { text: '预留', color: 'warning' },
  [SeatStatus.Sold]: { text: '已售', color: 'error' },
  [SeatStatus.Locked]: { text: '锁定', color: 'processing' },
  [SeatStatus.Maintenance]: { text: '维护', color: 'default' }
}

export const SESSION_STATUS_LABEL: Record<SessionStatus, { text: string; color: string }> = {
  [SessionStatus.Draft]: { text: '草稿', color: 'default' },
  [SessionStatus.Published]: { text: '已发布', color: 'processing' },
  [SessionStatus.Ongoing]: { text: '进行中', color: 'success' },
  [SessionStatus.Ended]: { text: '已结束', color: 'default' },
  [SessionStatus.Cancelled]: { text: '已取消', color: 'error' }
}

export const TODO_STATUS_LABEL: Record<TodoStatus, { text: string; color: string }> = {
  [TodoStatus.Pending]: { text: '待处理', color: 'warning' },
  [TodoStatus.Processing]: { text: '处理中', color: 'processing' },
  [TodoStatus.Completed]: { text: '已完成', color: 'success' },
  [TodoStatus.Cancelled]: { text: '已取消', color: 'default' }
}

export const TODO_PRIORITY_LABEL: Record<TodoPriority, { text: string; color: string }> = {
  [TodoPriority.Low]: { text: '低', color: 'blue' },
  [TodoPriority.Medium]: { text: '中', color: 'orange' },
  [TodoPriority.High]: { text: '高', color: 'red' },
  [TodoPriority.Urgent]: { text: '紧急', color: 'magenta' }
}

export const RETRY_STATUS_LABEL: Record<ApiRetryStatus, { text: string; color: string }> = {
  [ApiRetryStatus.Failed]: { text: '失败', color: 'error' },
  [ApiRetryStatus.Retrying]: { text: '重试中', color: 'processing' },
  [ApiRetryStatus.Success]: { text: '成功', color: 'success' },
  [ApiRetryStatus.MaxRetriesExceeded]: { text: '超出重试次数', color: 'warning' }
}
