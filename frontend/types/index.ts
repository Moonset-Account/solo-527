export interface ApiResponse<T = any> {
  code?: number
  message?: string
  data?: T
}

export interface UserInfo {
  id: number
  username: string
  real_name: string
  role: string
  phone?: string
  campus_id?: number
  avatar?: string
}

export interface PagedResponse<T> {
  total: number
  items: T[]
}

export interface Campus {
  id: number
  name: string
  address?: string
  contact_phone?: string
}

export interface ClassSimple {
  id: number
  class_code: string
  name: string
  major?: string
  current_students: number
  max_students: number
  status: string
}

export interface StudentSimple {
  id: number
  student_no: string
  name: string
  major: string
  phone?: string
  remaining_hours: number
  total_hours: number
}

export interface DashboardStats {
  today_schedules: number
  today_consumptions: number
  today_hours: number
  pending_todos: number
  overdue_reminders: number
  recent_submissions: number
  homework_unsubmitted: number
  pending_receipts: number
  total_students: number
  active_students: number
  total_classes: number
  average_fill_rate: number
}

export interface TodoItem {
  id?: number
  type: string
  title: string
  description?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  deadline?: string
  entity_type?: string
  entity_id?: number
  created_at?: string
}

export interface OverdueItem {
  id?: number
  type: string
  title: string
  overdue_time: string
  description?: string
  entity_type?: string
  entity_id?: number
  student_name?: string
  teacher_name?: string
}

export interface RecentSubmission {
  id: number
  type: string
  title: string
  student_name: string
  student_id: number
  submit_time: string
  status: string
  score?: number
  class_name?: string
}

export interface ScheduleItem {
  id: number
  schedule_code: string
  class_id: number
  class_name?: string
  teacher_id?: number
  teacher_name?: string
  classroom?: string
  course_date: string
  start_time: string
  end_time: string
  duration_minutes?: number
  topic?: string
  content?: string
  status: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  is_online?: boolean
  online_url?: string
  assigned_student_count: number
  attended_student_count: number
  color?: string
}

export interface ScheduleDetail extends ScheduleItem {
  created_by?: number
  created_at: string
  updated_at: string
  consumptions_count?: number
}

export interface ConsumptionItem {
  id: number
  consumption_code: string
  schedule_id: number
  student_id: number
  class_id?: number
  teacher_id?: number
  consumption_date: string
  hours_consumed: number
  status: 'pending' | 'consumed' | 'refunded' | 'cancelled'
  attendance: 'present' | 'absent' | 'late' | 'leave_early' | 'leave'
  sign_in_time?: string
  sign_out_time?: string
  confirmed_by?: number
  confirmed_at?: string
  remark?: string
  parent_verified: boolean
  parent_verified_at?: string
  created_at: string
  updated_at: string
}

export interface ConsumptionDetail extends ConsumptionItem {
  student_name?: string
  student_no?: string
  schedule_topic?: string
  schedule_code?: string
  course_date?: string
  class_name?: string
  confirmed_by_name?: string
  attachments: any[]
  remarks: any[]
  history_records: any[]
}

export interface ScheduleFillRate {
  class_id: number
  class_name: string
  max_students: number
  current_students: number
  fill_rate: number
  schedules_this_month: number
  consumed_hours: number
}

export interface StudentInfo {
  id: number
  student_no: string
  name: string
  gender?: 'male' | 'female'
  birthday?: string
  phone?: string
  school?: string
  grade?: string
  major: string
  target_school?: string
  enroll_date?: string
  status: string
  total_hours: number
  remaining_hours: number
  consumed_hours: number
  campus_id: number
  campus_name?: string
  teacher_id?: number
  teacher_name?: string
  avatar?: string
  created_at: string
}

export interface ClassInfo {
  id: number
  class_code: string
  name: string
  major?: string
  class_type?: string
  description?: string
  max_students: number
  current_students: number
  status: string
  campus_id: number
  campus_name?: string
  head_teacher_id?: number
  head_teacher_name?: string
  fill_rate?: number
  start_date?: string
  end_date?: string
  total_hours: number
  cover_image?: string
  created_at: string
}

export interface FeedbackItem {
  id: number
  feedback_code: string
  type: string
  class_id?: number
  class_name?: string
  student_id: number
  student_name?: string
  teacher_id: number
  teacher_name?: string
  title: string
  content: string
  score?: number
  max_score: number
  level?: string
  strengths?: string
  weaknesses?: string
  suggestions?: string
  work_images?: string[]
  is_private: boolean
  parent_seen: boolean
  parent_reply?: string
  parent_reply_at?: string
  created_at: string
  updated_at: string
}

export interface HomeworkItem {
  id: number
  homework_code: string
  title: string
  description?: string
  class_id: number
  class_name?: string
  teacher_id: number
  teacher_name?: string
  publish_date?: string
  deadline?: string
  max_score: number
  status: 'draft' | 'published' | 'closed'
  total_submissions: number
  attachments?: string[]
  created_at: string
}

export interface SubmissionItem {
  id: number
  homework_id: number
  homework_title?: string
  student_id: number
  student_name?: string
  submit_time?: string
  status: string
  content?: string
  attachments?: string[]
  score?: number
  feedback?: string
  graded_at?: string
  resubmit_count: number
  created_at: string
}

export interface NotificationItem {
  id: number
  notification_code: string
  type: string
  priority: string
  title: string
  content: string
  class_id?: number
  class_name?: string
  campus_id?: number
  publisher_id: number
  publisher_name?: string
  publish_time?: string
  is_draft: boolean
  require_receipt: boolean
  receipt_deadline?: string
  total_receipts: number
  confirmed_receipts: number
  attachments?: string[]
  created_at: string
}

export interface ReceiptItem {
  id: number
  notification_id: number
  user_id: number
  user_name?: string
  student_id?: number
  student_name?: string
  status: 'pending' | 'confirmed' | 'rejected'
  confirmed_at?: string
  remark?: string
  created_at: string
}

export interface QuestionBank {
  id: number
  version_code: string
  version_name: string
  major?: string
  subject?: string
  description?: string
  status: 'draft' | 'published' | 'archived'
  total_questions: number
  total_score: number
  duration_minutes: number
  passing_score: number
  published_at?: string
  file_path?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface ReminderItem {
  id: number
  type: string
  priority: string
  status: string
  title: string
  content: string
  user_id: number
  student_id?: number
  class_id?: number
  scheduled_at?: string
  sent_at?: string
  read_at?: string
  is_overdue: boolean
  created_at: string
}

export interface MonthlyFillRate {
  month: string
  campus_id?: number
  campus_name?: string
  overall_fill_rate: number
  total_classes: number
  total_students: number
  class_details: Array<{
    class_id: number
    class_name: string
    major?: string
    max_students: number
    current_students: number
    fill_rate: number
    schedules_count: number
    consumed_hours: number
  }>
  generated_at: string
}

export interface ReportRecord {
  id: number
  report_code: string
  type: string
  title: string
  campus_id?: number
  period_start: string
  period_end: string
  total_classes: number
  total_schedules: number
  total_consumptions: number
  total_hours_consumed: number
  average_fill_rate: number
  total_students: number
  active_students: number
  homework_completion_rate: number
  total_feedbacks: number
  total_notifications: number
  receipt_rate: number
  file_path?: string
  summary?: string
  created_at: string
}

export interface ConsumptionStats {
  date: string
  total_consumptions: number
  total_hours: number
  present_count: number
  absent_count: number
  leave_count: number
}

export interface HistoryRecord {
  id: number
  entity_type: string
  entity_id: number
  action: string
  field_name?: string
  old_value?: string
  new_value?: string
  change_summary?: string
  operator_id: number
  operator_name?: string
  created_at: string
}

export interface RemarkRecord {
  id: number
  content: string
  entity_type: string
  entity_id: number
  created_by: number
  created_by_name?: string
  is_private: boolean
  tags?: string[]
  created_at: string
}

export interface AttachmentRecord {
  id: number
  file_name: string
  original_name?: string
  file_path: string
  file_size?: number
  mime_type?: string
  entity_type: string
  entity_id: number
  category?: string
  uploaded_by?: number
  created_at: string
}
