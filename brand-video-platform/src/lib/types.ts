export type TopicStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'in_script' | 'in_filming' | 'in_editing' | 'scheduled' | 'published'

export interface Topic {
  id: string
  title: string
  description: string
  brand_line: string
  target_platform: string[]
  expected_publish_date: string | null
  tags: string[]
  status: TopicStatus
  creator_id: string
  creator_name: string
  reviewer_id: string | null
  reviewer_name: string | null
  created_at: string
  updated_at: string
}

export type ScriptStatus = 'draft' | 'submitted' | 'approved' | 'revision_needed'

export interface Script {
  id: string
  topic_id: string
  content: string
  version: number
  status: ScriptStatus
  author_id: string
  author_name: string
  created_at: string
  updated_at: string
}

export type TaskType = 'filming' | 'editing'
export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'overdue'

export interface Task {
  id: string
  topic_id: string
  topic_title: string
  type: TaskType
  assignee_id: string | null
  assignee_name: string | null
  status: TaskStatus
  deadline: string | null
  description: string
  created_at: string
  updated_at: string
}

export type ScheduleStatus = 'scheduled' | 'published' | 'cancelled'

export interface Schedule {
  id: string
  topic_id: string
  topic_title: string
  platform: string
  publish_date: string
  publish_time: string | null
  status: ScheduleStatus
  operator_id: string
  operator_name: string
  created_at: string
  updated_at: string
}

export type ExceptionStatus = 'pending' | 'processing' | 'resolved'

export interface ExceptionRecord {
  id: string
  topic_id: string | null
  topic_title: string | null
  script_id: string | null
  type: 'sensitive_word'
  sensitive_word: string
  content_snippet: string
  status: ExceptionStatus
  handler_id: string | null
  handler_name: string | null
  conclusion: string | null
  created_at: string
  resolved_at: string | null
}

export type TimelineEventType = 'topic_created' | 'topic_approved' | 'topic_rejected' | 'script_submitted' | 'script_approved' | 'task_assigned' | 'task_completed' | 'exception_created' | 'exception_resolved' | 'schedule_created' | 'published'

export interface TimelineEvent {
  id: string
  topic_id: string
  event_type: TimelineEventType
  actor_id: string
  actor_name: string
  description: string
  metadata: Record<string, unknown>
  created_at: string
}

export type UserRole = 'admin' | 'director' | 'cameraman' | 'editor' | 'operator'

export interface Profile {
  id: string
  display_name: string
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export interface MaterialTag {
  id: string
  topic_id: string
  tag_name: string
  category: string
  created_at: string
}

export interface SensitiveWord {
  id: string
  word: string
  category: string
  is_active: boolean
  created_at: string
}

export const TOPIC_STATUS_MAP: Record<TopicStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-700' },
  pending_review: { label: '待审批', color: 'bg-amber-100 text-amber-700' },
  approved: { label: '已通过', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-700' },
  in_script: { label: '脚本编写中', color: 'bg-blue-100 text-blue-700' },
  in_filming: { label: '拍摄中', color: 'bg-purple-100 text-purple-700' },
  in_editing: { label: '剪辑中', color: 'bg-indigo-100 text-indigo-700' },
  scheduled: { label: '已排期', color: 'bg-cyan-100 text-cyan-700' },
  published: { label: '已发布', color: 'bg-green-100 text-green-700' },
}

export const TASK_STATUS_MAP: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: '待分派', color: 'bg-gray-100 text-gray-700' },
  assigned: { label: '已分派', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: '进行中', color: 'bg-amber-100 text-amber-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  overdue: { label: '已逾期', color: 'bg-red-100 text-red-700' },
}

export const EXCEPTION_STATUS_MAP: Record<ExceptionStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-red-100 text-red-700' },
  processing: { label: '处理中', color: 'bg-amber-100 text-amber-700' },
  resolved: { label: '已解决', color: 'bg-green-100 text-green-700' },
}

export const SCHEDULE_STATUS_MAP: Record<ScheduleStatus, { label: string; color: string }> = {
  scheduled: { label: '已排期', color: 'bg-blue-100 text-blue-700' },
  published: { label: '已发布', color: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-700' },
}

export const ROLE_LABEL_MAP: Record<UserRole, string> = {
  admin: '品牌内容负责人',
  director: '编导',
  cameraman: '摄影师',
  editor: '剪辑师',
  operator: '运营专员',
}
