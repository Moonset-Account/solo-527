export interface UserInfo {
  id: number
  username: string
  email: string
  full_name: string
  role: 'admin' | 'compliance_manager' | 'lawyer' | 'reviewer' | 'submitter'
  phone?: string
  department?: string
  is_active?: boolean
  created_at?: string
}

export interface AnswerStatus {
  value: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable' | 'pending'
  label: string
}

export interface ChecklistItem {
  id: number
  item_order: number
  section: string
  question: string
  description?: string
  required_evidence?: string
  default_risk_level?: string
  is_required: boolean
}

export interface ChecklistTemplate {
  id: number
  name: string
  description?: string
  contract_version?: string
  category?: string
  is_active: boolean
  created_by?: number
  created_at?: string
  items: ChecklistItem[]
}

export interface ChecklistAnswer {
  id: number
  submission_id: number
  item_id: number
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable' | 'pending'
  answer_text?: string
  evidence_url?: string
  evidence_description?: string
  comment?: string
  created_at?: string
  item?: ChecklistItem
}

export interface Submission {
  id: number
  checklist_id: number
  submitter_id: number
  contract_name: string
  contract_version?: string
  counterparty?: string
  contract_amount?: number
  status: 'draft' | 'submitted' | 'under_review' | 'lawyer_reviewed' | 'reviewer_approved' | 'rejected' | 'closed'
  deadline?: string
  risk_level?: string
  overall_score?: number
  review_comment?: string
  submitted_at?: string
  completed_at?: string
  created_at?: string
  checklist?: ChecklistTemplate
  answers: ChecklistAnswer[]
}

export interface Gap {
  id: number
  submission_id: number
  item_id: number
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'in_progress' | 'mitigated' | 'closed' | 'accepted'
  remediation_plan?: string
  remediation_deadline?: string
  remediation_owner_id?: number
  actual_resolve_date?: string
  resolution_note?: string
  evidence_details?: any[]
  created_by?: number
  created_at?: string
}

export interface Assignment {
  id: number
  submission_id: number
  lawyer_id?: number
  reviewer_id?: number
  status: 'assigned' | 'lawyer_processing' | 'lawyer_done' | 'reviewer_processing' | 'completed'
  lawyer_deadline?: string
  reviewer_deadline?: string
  lawyer_comment?: string
  reviewer_comment?: string
  assigned_by?: number
  assigned_at?: string
  lawyer_started_at?: string
  lawyer_finished_at?: string
  reviewer_started_at?: string
  reviewer_finished_at?: string
}

export interface SystemConfig {
  id: number
  config_type: string
  config_key: string
  config_value?: string
  config_data?: any
  description?: string
  effective_start?: string
  effective_end?: string
  is_active: boolean
  sort_order: number
  created_by?: number
  created_at?: string
}

export interface Reminder {
  id: number
  type: string
  recipient_id: number
  sender_id?: number
  submission_id?: number
  gap_id?: number
  title: string
  content: string
  status: 'unread' | 'read' | 'processed'
  related_data?: any
  read_at?: string
  processed_at?: string
  created_at?: string
}

export interface GapDetail {
  gap: Gap
  submission?: any
  item?: any
  owner?: string
  histories: any[]
}

export interface DashboardStats {
  todo_count: number
  abnormal_count: number
  overdue_count: number
  gap_open_count: number
  submission_total: number
  gap_total: number
  completed_rate: number
  on_time_rate: number
}

export interface DashboardTrend {
  last_14_days: { date: string; submission_count: number; gap_count: number; completed_count: number }[]
  by_risk_level: Record<string, number>
  by_status: Record<string, number>
}
