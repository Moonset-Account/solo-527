export type UserRole = 'admin' | 'manager' | 'user';

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'overdue';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type AuditAction =
  | 'create'
  | 'update_status'
  | 'update_progress'
  | 'upload_attachment'
  | 'delete_attachment'
  | 'comment'
  | 'missing_attachment'
  | 'claim'
  | 'assign';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department_id: string;
  avatar_url?: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  manager_id?: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  department_id: string;
  assignee_id?: string;
  creator_id: string;
  deadline: string;
  completed_at?: string;
  requires_attachment: boolean;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  task_id: string;
  version: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  mentions: string[];
  created_at: string;
}

export interface AuditLog {
  id: string;
  task_id: string;
  user_id: string;
  action: AuditAction;
  old_value?: string;
  new_value?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ReminderRule {
  id: string;
  department_id?: string;
  days_before: number;
  repeat_interval: number;
  notify_email: boolean;
  enabled: boolean;
  created_at: string;
}

export interface TaskWithRelations extends Task {
  assignee?: Pick<User, 'id' | 'name' | 'avatar_url'>;
  creator?: Pick<User, 'id' | 'name' | 'avatar_url'>;
  department?: Pick<Department, 'id' | 'name'>;
  attachments?: Attachment[];
  comments?: (Comment & { user?: Pick<User, 'id' | 'name' | 'avatar_url'> })[];
  audit_logs?: (AuditLog & { user?: Pick<User, 'id' | 'name' | 'avatar_url'> })[];
}

export interface DepartmentStats {
  department_id: string;
  department_name: string;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  in_progress_tasks: number;
  todo_tasks: number;
  closure_rate: number;
}

export interface TaskFilters {
  status?: TaskStatus;
  department_id?: string;
  assignee_id?: string;
  priority?: TaskPriority;
  deadline_from?: string;
  deadline_to?: string;
  search?: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  priority: TaskPriority;
  department_id: string;
  assignee_id?: string;
  deadline: string;
  requires_attachment: boolean;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  progress?: number;
  assignee_id?: string;
  deadline?: string;
  requires_attachment?: boolean;
}

export interface UploadAttachmentInput {
  task_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  file_content: string;
}

export interface CreateCommentInput {
  task_id: string;
  content: string;
  mentions: string[];
}
