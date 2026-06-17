export type QuestionType = 'single_choice' | 'multiple_choice' | 'coding' | 'short_answer'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type AssessmentStatus = 'draft' | 'active' | 'archived'
export type InterviewStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type InterviewResult = 'pass' | 'fail' | 'pending'
export type AvailabilityStatus = 'available' | 'busy' | 'leave'
export type HiringDecision = 'hired' | 'rejected' | 'pending'
export type AlertType = 'conflict' | 'score_anomaly' | 'overdue' | 'custom'
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical'
export type ExportType = 'interview_summary' | 'scoring_analysis' | 'hiring_result' | 'quality_metrics'

export interface Question {
  id: string
  type: QuestionType
  content: string
  options?: string[]
  difficulty: Difficulty
  category: string
  scoring_standard_id?: string
  points: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ScoringStandard {
  id: string
  name: string
  position: string
  dimensions: ScoringDimension[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ScoringDimension {
  name: string
  weight: number
  levels: ScoringLevel[]
}

export interface ScoringLevel {
  level: string
  min_score: number
  max_score: number
  description: string
}

export interface Assessment {
  id: string
  title: string
  description: string
  duration_minutes: number
  questions: AssessmentQuestion[]
  status: AssessmentStatus
  created_at: string
}

export interface AssessmentQuestion {
  id: string
  assessment_id: string
  question_id: string
  sort_order: number
  question?: Question
}

export interface Submission {
  id: string
  assessment_id: string
  candidate_name: string
  candidate_email: string
  total_score?: number
  submitted_at: string
  answers?: SubmissionAnswer[]
}

export interface SubmissionAnswer {
  id: string
  submission_id: string
  question_id: string
  content: string
  auto_score?: number
  manual_score?: number
}

export interface Interviewer {
  id: string
  user_id?: string
  name: string
  email: string
  department?: string
}

export interface InstructorAvailability {
  id: string
  interviewer_id: string
  date: string
  start_time: string
  end_time: string
  status: AvailabilityStatus
  interviewer?: Interviewer
}

export interface Interview {
  id: string
  candidate_name: string
  candidate_email: string
  submission_id?: string
  interviewer_id: string
  scheduled_at: string
  duration_minutes: number
  status: InterviewStatus
  result?: InterviewResult
  notes?: string
  created_at: string
  interviewer?: Interviewer
  scores?: InterviewScore[]
}

export interface InterviewScore {
  id: string
  interview_id: string
  dimension: string
  score: number
  max_score: number
  comment?: string
}

export interface HiringResult {
  id: string
  interview_id: string
  decision: HiringDecision
  position: string
  department: string
  notes?: string
  decided_at: string
  decided_by?: string
  interview?: Interview
}

export interface SystemConfig {
  id: string
  key: string
  value: string
  description?: string
  is_toggleable: boolean
  updated_by?: string
  updated_at: string
}

export interface ConfigChangeLog {
  id: string
  config_key: string
  old_value?: string
  new_value?: string
  changed_by?: string
  changed_at: string
}

export interface ReminderRule {
  id: string
  name: string
  rule_type: AlertType
  trigger_condition: string
  urgency_level: UrgencyLevel
  notify_channels: string[]
  is_active: boolean
  config?: Record<string, string | number | boolean>
  created_at: string
}

export interface Alert {
  id: string
  type: AlertType
  urgency_level: UrgencyLevel
  title: string
  description?: string
  related_entity_id?: string
  is_resolved: boolean
  created_at: string
}

export interface ExportReport {
  id: string
  name: string
  type: ExportType
  filters: Record<string, unknown>
  filter_summary: string
  generated_at: string
  generated_by?: string
  file_url?: string
}
