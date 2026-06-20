export interface Issue {
  id: number
  code: string
  title: string
  description: string
  category: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  status: 'PENDING' | 'VOTING' | 'RECTIFYING' | 'REVIEWING' | 'DONE' | 'CANCELLED'
  community?: string | null
  gridNo?: string | null
  location?: string | null
  reporterId?: number | null
  reporter?: Resident
  handler?: string | null
  voteEndAt?: string | null
  rectifyDeadline?: string | null
  published: boolean
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
  photos?: Photo[]
  votes?: Vote[]
  rectifications?: Rectification[]
  reviews?: Review[]
  gridEvents?: GridEvent[]
  todos?: Todo[]
  operationLogs?: OperationLog[]
  _count?: { votes: number; rectifications: number; reviews: number; gridEvents: number; photos: number }
}

export interface Resident {
  id: number
  phone: string
  name: string
  address?: string | null
  community?: string | null
  createdAt: string
}

export interface Vote {
  id: number
  issueId: number
  residentId: number
  resident?: Resident
  option: 'AGREE' | 'DISAGREE' | 'ABSTAIN'
  comment?: string | null
  createdAt: string
}

export interface Rectification {
  id: number
  issueId: number
  action: string
  handler?: string | null
  deadline?: string | null
  completed: boolean
  completedAt?: string | null
  note?: string | null
  createdAt: string
  updatedAt: string
  photos?: Photo[]
}

export interface Review {
  id: number
  issueId: number
  reviewer: string
  result: 'PASS' | 'FAIL' | 'IMPROVE'
  comment?: string | null
  rated?: number | null
  reviewedAt: string
  photos?: Photo[]
}

export interface Photo {
  id: number
  url: string
  type: string
  issueId?: number | null
  rectificationId?: number | null
  reviewId?: number | null
  createdAt: string
}

export interface GridEvent {
  id: number
  issueId: number
  eventType: string
  description: string
  gridNo: string
  handler?: string | null
  occurredAt: string
  handled: boolean
  handledAt?: string | null
  patrolCovered: boolean
  createdAt: string
}

export interface Todo {
  id: number
  issueId: number
  issue?: { id: number; code: string; title: string; status: string; gridNo?: string | null }
  type: string
  title: string
  description?: string | null
  assignee?: string | null
  deadline?: string | null
  done: boolean
  fromTimeout: boolean
  patrolSynced: boolean
  doneAt?: string | null
  createdAt: string
}

export interface OperationLog {
  id: number
  issueId?: number | null
  rectificationId?: number | null
  operator: string
  action: string
  detail?: string | null
  createdAt: string
}

export interface ApiException {
  id: number
  traceId: string
  method: string
  path: string
  issueCode?: string | null
  status: number
  errorCode?: string | null
  message: string
  stack?: string | null
  requestBody?: string | null
  happenedAt: string
}

export interface PatrolStat {
  id: number
  date: string
  gridNo: string
  patrolCount: number
  coveredCount: number
  timeoutTodoCount: number
  handledEventCount: number
  note?: string | null
}

export interface PageResult<T> {
  total: number
  rows: T[]
  page: number
  size: number
}

export interface ApiResp<T> {
  code: number
  message: string
  data: T
  traceId?: string
}
