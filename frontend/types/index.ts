export interface User {
  id: number
  username: string
  email: string
  full_name: string | null
  phone: string | null
  role: 'admin' | 'recruiter' | 'candidate'
  is_active: boolean
  avatar: string | null
  department: string | null
  created_at: string
}

export interface Position {
  id: number
  title: string
  department: string | null
  job_type: string | null
  city: string | null
  salary_range: string | null
  description: string | null
  requirements: string | null
  headcount: number
  is_active: boolean
  created_by: number | null
  created_at: string
  updated_at: string | null
}

export interface Candidate {
  id: number
  user_id: number | null
  name: string
  gender: string | null
  birth_date: string | null
  phone: string | null
  email: string | null
  university: string | null
  major: string | null
  degree: string | null
  graduation_year: number | null
  gpa: string | null
  resume_url: string | null
  avatar: string | null
  source_channel: string | null
  expected_salary: string | null
  city: string | null
  skills: string | null
  introduction: string | null
  created_at: string
  updated_at: string | null
}

export type ApplicationStatus =
  | 'submitted'
  | 'screening'
  | 'screening_passed'
  | 'assessment'
  | 'assessment_passed'
  | 'interview'
  | 'interview_passed'
  | 'offer'
  | 'offer_accepted'
  | 'rejected'
  | 'cancelled'

export type ApplicationStage =
  | 'resume_screen'
  | 'assessment'
  | 'tech_interview'
  | 'hr_interview'
  | 'offer'
  | 'onboarding'

export interface Application {
  id: number
  candidate_id: number
  position_id: number
  status: ApplicationStatus
  current_stage: ApplicationStage
  source_channel: string | null
  assigned_recruiter: number | null
  notes: string | null
  rating: number | null
  applied_at: string
  created_at: string
  updated_at: string | null
  candidate?: Candidate
  position?: Position
}

export interface StatusHistory {
  id: number
  application_id: number
  from_status: ApplicationStatus | null
  to_status: ApplicationStatus
  from_stage: ApplicationStage | null
  to_stage: ApplicationStage | null
  changed_by: number | null
  change_reason: string | null
  channel: string | null
  cycle_days: number | null
  changed_at: string
  remarks: string | null
}

export type InterviewType = 'phone' | 'video' | 'onsite' | 'assessment'
export type InterviewStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
export type InterviewResult = 'pass' | 'fail' | 'pending' | 'need_review'

export interface Interview {
  id: number
  application_id: number
  interview_type: InterviewType
  round_number: number
  title: string | null
  description: string | null
  start_time: string
  end_time: string
  location: string | null
  meeting_link: string | null
  interviewer_ids: string | null
  status: InterviewStatus
  result: InterviewResult | null
  score: number | null
  feedback: string | null
  created_by: number | null
  scheduled_by: number | null
  created_at: string
  updated_at: string | null
}

export type TodoType = 'normal' | 'escalated' | 'interview_conflict' | 'status_expired' | 'follow_up'
export type TodoPriority = 'low' | 'normal' | 'high' | 'urgent'
export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface Todo {
  id: number
  title: string
  description: string | null
  todo_type: TodoType
  priority: TodoPriority
  status: TodoStatus
  assigned_to: number | null
  related_entity_type: string | null
  related_entity_id: number | null
  due_date: string | null
  is_escalated: boolean
  escalated_at: string | null
  escalation_reason: string | null
  completed_at: string | null
  completed_by: number | null
  created_by: number | null
  created_at: string
  updated_at: string | null
}

export interface ReminderRule {
  id: number
  rule_name: string
  rule_type: string
  trigger_condition: string | null
  reminder_frequency_minutes: number
  max_reminders: number
  is_active: boolean
  notify_channels: string | null
  escalation_minutes: number | null
  description: string | null
  created_by: number | null
  created_at: string
  updated_at: string | null
}

export interface Offer {
  id: number
  application_id: number | null
  candidate_id: number | null
  position_id: number | null
  offer_title: string | null
  salary_base: number | null
  salary_bonus: string | null
  benefits: string | null
  department: string | null
  report_to: string | null
  work_location: string | null
  start_date: string | null
  probation_months: number
  offer_expiry_date: string | null
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'cancelled'
  sent_at: string | null
  responded_at: string | null
  response_note: string | null
  created_by: number | null
  approved_by: number | null
  created_at: string
  updated_at: string | null
}

export interface CheckInRecord {
  id: number
  interview_id: number
  candidate_id: number | null
  check_in_time: string | null
  status: 'checked_in' | 'late' | 'not_checked' | 'early'
  check_in_method: string | null
  location: string | null
  device_info: string | null
  notes: string | null
  created_at: string
}

export interface Question {
  id: number
  question_text: string
  question_type: 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'coding'
  difficulty: 'easy' | 'medium' | 'hard'
  category: string | null
  tags: string | null
  options: Record<string, any> | null
  correct_answer: string | null
  explanation: string | null
  points: number
  time_limit_seconds: number | null
  is_active: boolean
  created_by: number | null
  created_at: string
  updated_at: string | null
}

export interface DictionaryType {
  id: number
  type_code: string
  type_name: string
  description: string | null
  is_system: boolean
  is_active: boolean
  created_by: number | null
  created_at: string
  updated_at: string | null
}

export interface DictionaryItem {
  id: number
  type_id: number
  item_code: string
  item_value: string
  item_label: string | null
  sort_order: number
  is_active: boolean
  remark: string | null
  extra_data: string | null
  created_at: string
  updated_at: string | null
}

export interface SystemConfig {
  id: number
  config_key: string
  config_value: string | null
  config_label: string | null
  config_type: string
  description: string | null
  group_name: string | null
  is_active: boolean
  updated_by: number | null
  created_at: string
  updated_at: string | null
}

export interface AuditLog {
  id: number
  user_id: number | null
  username: string | null
  role: string | null
  action: string
  entity_type: string | null
  entity_id: number | null
  old_value: string | null
  new_value: string | null
  ip_address: string | null
  user_agent: string | null
  description: string | null
  created_at: string
}
