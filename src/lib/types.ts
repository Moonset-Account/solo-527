export type UserRole = 'super_admin' | 'sales_manager' | 'sales_consultant' | 'analyst';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  team_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface LeadStage {
  id: string;
  name: string;
  color: string;
  order: number;
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  updated_at: string;
}

export interface LeadTag {
  id: string;
  name: string;
  color: string;
  category: string;
  created_by?: string;
  updated_by?: string;
}

export type FollowUpMethod = 'phone' | 'wechat' | 'visit' | 'other';

export interface FollowUpRecord {
  id: string;
  lead_id: string;
  follow_up_time: string;
  method: FollowUpMethod;
  content: string;
  next_follow_up_at?: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
}

export interface SurveyRecord {
  id: string;
  lead_id: string;
  survey_time: string;
  surveyor_id: string;
  surveyor_name?: string;
  photos: string[];
  measurements: Record<string, number>;
  customer_notes?: string;
  created_at: string;
}

export interface ContractAttachment {
  id: string;
  lead_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  version: number;
  uploaded_by: string;
  uploaded_by_name?: string;
  created_at: string;
}

export type ChangeType = 'create' | 'update' | 'stage_change' | 'assign' | 'recycle';

export interface ChangeLog {
  id: string;
  lead_id: string;
  field?: string;
  old_value?: any;
  new_value?: any;
  changed_by: string;
  changed_by_name?: string;
  changed_at: string;
  change_type: ChangeType;
}

export interface Lead {
  id: string;
  customer_name: string;
  phone: string;
  community?: string;
  area?: number;
  budget_min?: number;
  budget_max?: number;
  style?: string;
  source?: string;
  stage_id: string;
  assignee_id?: string;
  assignee_name?: string;
  tags: string[];
  remark?: string;
  is_in_pool: boolean;
  auto_recycle_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RevisitRecord {
  id: string;
  lead_id: string;
  phone: string;
  consult_count: number;
  first_consult_at: string;
  last_consult_at: string;
  reasons: string[];
  avg_interval_hours: number;
  current_owner_id?: string;
  current_owner_name?: string;
  total_process_hours: number;
}

export interface DashboardStats {
  totalLeads: number;
  inPool: number;
  inProgress: number;
  completed: number;
  totalRevenue: number;
  conversionRate: number;
  avgCycleDays: number;
  poolConversionRate: number;
  today_new_leads?: number;
  pending_follow_ups?: number;
  upcoming_surveys?: number;
  predicted_revenue?: number;
  revenue_change?: number;
  leads_change?: number;
  followup_change?: number;
  survey_change?: number;
}
