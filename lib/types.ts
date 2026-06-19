export type UserRole = 'admin' | 'project_manager' | 'customer';

export interface User {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export type ProjectStatus = 'pending' | 'in_progress' | 'completed' | 'suspended';

export interface Project {
  id: string;
  name: string;
  address: string;
  customer_name: string;
  customer_phone: string;
  scheme_id: string | null;
  scheme_name?: string;
  project_manager_id: string;
  project_manager_name?: string;
  status: ProjectStatus;
  budget_total: number;
  budget_used: number;
  start_date: string;
  planned_end_date: string;
  actual_end_date: string | null;
  delay_days?: number;
  created_at: string;
}

export type NodeStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed';

export interface ProjectNode {
  id: string;
  project_id: string;
  project_name?: string;
  name: string;
  sequence: number;
  status: NodeStatus;
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date: string | null;
  actual_end_date: string | null;
  assignee_id: string | null;
  assignee_name?: string;
  delay_reason: string | null;
  delay_days: number;
  remark: string | null;
}

export type QuotationStatus = 'draft' | 'pending_confirm' | 'confirmed' | 'rejected';

export interface QuotationItem {
  id: string;
  category: string;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  remark?: string;
}

export interface Quotation {
  id: string;
  project_id: string;
  version: number;
  status: QuotationStatus;
  total_amount: number;
  confirmed_by: string | null;
  confirmed_at: string | null;
  reject_reason: string | null;
  items: QuotationItem[];
}

export type AddonStatus = 'pending' | 'confirmed' | 'rejected';

export interface Addon {
  id: string;
  project_id: string;
  project_name?: string;
  name: string;
  description: string;
  amount: number;
  status: AddonStatus;
  requested_by: string;
  requested_by_name?: string;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
}

export type BudgetChangeType = 'quotation' | 'addon' | 'adjustment';

export interface BudgetChangeLog {
  id: string;
  project_id: string;
  change_type: BudgetChangeType;
  change_amount: number;
  before_budget: number;
  after_budget: number;
  reason: string;
  operator_id: string;
  operator_name?: string;
  created_at: string;
}

export type InspectionTaskStatus = 'pending' | 'in_progress' | 'completed' | 'rectifying';

export interface InspectionItem {
  id: string;
  name: string;
  standard: string;
  score?: number;
  is_passed?: boolean;
  issue_description?: string;
  rectification_deadline?: string;
  rectification_photo_url?: string;
}

export interface InspectionTask {
  id: string;
  project_id: string;
  project_name?: string;
  node_id: string | null;
  node_name?: string;
  template_id: string;
  status: InspectionTaskStatus;
  planned_date: string;
  executed_by: string;
  executed_by_name?: string;
  executed_at: string | null;
  score?: number;
  items: InspectionItem[];
}

export type TicketStatus = 'pending' | 'processing' | 'completed' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface AfterSalesTicket {
  id: string;
  project_id: string;
  project_name?: string;
  title: string;
  description: string;
  photo_urls: string[];
  reporter_id: string;
  reporter_name?: string;
  assignee_id: string | null;
  assignee_name?: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  completed_at: string | null;
}

export interface DecorationScheme {
  id: string;
  name: string;
  description: string;
  standard_nodes: { name: string; duration_days: number }[];
  material_list: { name: string; brand: string; unit: string }[];
  construction_standards: Record<string, string>;
  is_active: boolean;
  created_at: string;
}

export type ReminderRuleType = 'node_delay' | 'inspection_due' | 'warranty_expire';
export type NotifyChannel = 'email' | 'sms' | 'in_app';

export interface ReminderRule {
  id: string;
  name: string;
  type: ReminderRuleType;
  warning_days_before: number;
  notify_channels: NotifyChannel[];
  notify_roles: UserRole[];
  is_active: boolean;
  created_at: string;
}

export type ConfigType = 'reminder_rules' | 'inspection_template' | 'scheme';

export interface ConfigVersion {
  id: string;
  config_type: ConfigType;
  version: number;
  snapshot: Record<string, unknown>;
  change_summary: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  is_current: boolean;
}

export interface SavedFilter {
  id: string;
  user_id: string;
  page_key: string;
  name: string;
  filter_params: Record<string, unknown>;
  sort_params?: Record<string, 'asc' | 'desc'>;
  is_default: boolean;
  created_at: string;
}

export interface DrawingFile {
  id: string;
  project_id: string;
  version: number;
  file_name: string;
  file_url: string;
  file_size: number;
  uploaded_by: string;
  uploaded_by_name?: string;
  remark?: string;
  created_at: string;
}

export interface MonthlyReport {
  month: string;
  total_projects: number;
  completed_projects: number;
  delayed_nodes: number;
  avg_delay_days: number;
  avg_quality_score: number;
  budget_overrun_rate: number;
  managers: {
    id: string;
    name: string;
    project_count: number;
    on_time_rate: number;
    avg_quality_score: number;
  }[];
  delay_reasons: { reason: string; count: number }[];
  quality_issues: { category: string; count: number }[];
}
