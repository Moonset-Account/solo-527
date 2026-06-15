export type UserRole = 'USER' | 'ADMIN_LEAD' | 'ADMIN';

export type TaskStatus =
  | 'PENDING_CLAIM'
  | 'IN_PROGRESS'
  | 'DELAYED'
  | 'COMPLETED'
  | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type LogAction =
  | 'TASK_CREATED'
  | 'TASK_CLAIMED'
  | 'TASK_COMPLETED'
  | 'TASK_CANCELLED'
  | 'PROGRESS_UPDATED'
  | 'DELAY_RECORDED'
  | 'ASSIGNEE_CHANGED'
  | 'STATUS_CHANGED'
  | 'REMINDER_SENT'
  | 'REMINDER_SCHEDULED'
  | 'USER_CREATED'
  | 'USER_ROLE_CHANGED';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface TaskListItem {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  dueDate?: string | null;
  completedAt?: string | null;
  remindCount: number;
  lastRemindedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: { id: string; name: string; department?: string | null } | null;
  creator: { id: string; name: string };
  progressRecordsCount: number;
  delayReasonsCount: number;
}

export interface OwnershipStat {
  userId: string;
  userName: string;
  department?: string | null;
  totalCount: number;
  completedCount: number;
  delayedCount: number;
  inProgressCount: number;
  pendingClaimCount: number;
  completionRate: number;
  delayRate: number;
  avgProcessingHours: number;
}

export interface TrendDataPoint {
  label: string;
  pendingClaim: number;
  inProgress: number;
  completed: number;
  delayed: number;
}
