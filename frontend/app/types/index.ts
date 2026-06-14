export interface User {
  id: number
  username: string
  role: string
  display_name: string
  is_demo: boolean
  created_at?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user_id: number
  username: string
  role: string
  display_name: string
}

export interface Customer {
  id: number
  name: string
  phone?: string
  address?: string
  is_demo: boolean
  created_at?: string
}

export interface MaterialItem {
  name: string
  brand?: string
  model?: string
  quantity?: number
  unit?: string
  price?: number
}

export interface ConstructionNode {
  name: string
  duration?: number
  description?: string
}

export interface Plan {
  id: number
  name: string
  customer_id: number
  customer_name?: string
  area: number
  style: string
  estimated_budget: number
  design_description?: string
  materials?: MaterialItem[]
  cover_images?: string[]
  status: string
  is_demo: boolean
  created_at?: string
}

export interface Contract {
  id: number
  name: string
  customer_id: number
  customer_name?: string
  plan_id: number
  plan_name?: string
  budget_version_id?: number
  amount: number
  status: string
  start_date?: string
  end_date?: string
  is_demo: boolean
  created_at?: string
}

export interface BudgetItem {
  name: string
  amount: number
  unit: string
}

export interface BudgetVersion {
  id: number
  contract_id?: number
  version: string
  items: BudgetItem[]
  is_demo: boolean
  created_at?: string
}

export interface AcceptanceTemplate {
  id: number
  name: string
  items: string[]
  is_demo: boolean
  created_at?: string
}

export interface InspectionTemplate {
  id: number
  name: string
  check_items: string[]
  is_demo: boolean
  created_at?: string
}

export interface InspectionTask {
  id: number
  contract_id: number
  contract_name?: string
  template_id?: number
  template_name?: string
  inspector_id: number
  inspector_name?: string
  node_name: string
  status: 'pending' | 'in_progress' | 'completed' | 'accepted'
  deadline: string
  is_delayed: boolean
  is_demo: boolean
  created_at?: string
}

export interface InspectionRecord {
  id?: number
  task_id: number
  quality_score: number
  description?: string
  conclusion: 'pass' | 'fail' | 'conditional_pass'
  photos?: string[]
  is_demo?: boolean
  created_at?: string
}

export interface SatisfactionRecord {
  id: number
  contract_id: number
  customer_id: number
  contract_name?: string
  customer_name?: string
  level: 'pending' | 'satisfied' | 'neutral' | 'dissatisfied'
  comment?: string
  is_demo: boolean
  created_at?: string
}

export interface Notification {
  id: number
  user_id: number
  type: 'inspection_due' | 'delay_warning' | 'material_reminder' | 'satisfaction_reminder'
  title: string
  content?: string
  is_read: boolean
  is_demo: boolean
  created_at?: string
}

export interface ConfigChangeLog {
  id: number
  user_id: number
  entity_type: string
  entity_id: number
  action: 'create' | 'update' | 'delete'
  before_data?: Record<string, any>
  after_data?: Record<string, any>
  is_demo: boolean
  created_at?: string
  user_name?: string
}

export interface QualityReport {
  avg_score: number
  issue_count: number
  delay_count: number
  pass_count: number
  fail_count: number
  conditional_pass_count: number
  details: {
    id: number
    task_id: number
    node_name: string
    contract_name: string
    quality_score: number
    conclusion: string
    created_at: string
  }[]
}

export interface DelayReport {
  total: number
  total_tasks: number
  by_reason: Record<string, number>
  items: {
    id: number
    node_name: string
    contract_name: string
    deadline: string
    status: string
    inspector_id: number
  }[]
}

export interface PaginatedResponse<T = any> {
  items: T[]
  total: number
  page: number
  page_size: number
}
