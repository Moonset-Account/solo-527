export interface User {
  id: number;
  username: string;
  role: 'admin' | 'project_manager' | 'finance';
}

export interface Reconciliation {
  id: number;
  project_name: string;
  client_name: string;
  uploaded_by: number;
  uploaded_at: string;
  status: 'pending' | 'compared' | 'confirmed' | 'rejected';
  total_amount: number;
  matched_amount: number;
  difference_amount: number;
  file: string;
}

export interface Difference {
  id: number;
  reconciliation: number;
  item_type: 'amount' | 'date' | 'missing';
  system_value: string;
  uploaded_value: string;
  is_confirmed: boolean | null;
  confirmed_by: number | null;
  confirmed_at: string | null;
}

export interface Reminder {
  id: number;
  reconciliation: number;
  assignee: number;
  assignee_name: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'handled' | 'escalated';
  due_date: string;
  created_at: string;
  handled_at: string | null;
  escalation_level: number;
}

export interface ReminderConfig {
  id: number;
  first_reminder_days: number;
  repeat_interval_days: number;
  escalation_timeout_hours: number;
  max_escalation_level: number;
}

export interface InvoiceConfig {
  id: number;
  approval_required: boolean;
  auto_apply_threshold: number;
  updated_by: number;
  updated_by_name: string;
  updated_at: string;
}

export interface PrepaidConfig {
  id: number;
  balance_threshold: number;
  warning_enabled: boolean;
  updated_by: number;
  updated_by_name: string;
  updated_at: string;
}

export interface CashForecastConfig {
  id: number;
  forecast_window_days: number;
  confidence_threshold: number;
  updated_by: number;
  updated_by_name: string;
  updated_at: string;
}

export interface ConfigChangelog {
  id: number;
  config_type: string;
  field_name: string;
  old_value: string;
  new_value: string;
  changed_by: number;
  changed_by_name: string;
  changed_at: string;
}

export interface OverdueDetail {
  id: number;
  reminder_id: number;
  reconciliation_id: number;
  project_name: string;
  client_name: string;
  total_amount: number;
  difference_amount: number;
  overdue_days: number;
  assignee_id: number;
  assignee_name: string;
  priority: string;
  status: string;
  escalation_level: number;
  due_date: string;
}

export interface MismatchRecord {
  id: number;
  difference_id: number;
  reconciliation_id: number;
  project_name: string;
  client_name: string;
  item_type: string;
  system_value: string;
  uploaded_value: string;
  is_confirmed: boolean;
}

export interface DashboardStats {
  total_overdue_amount: number;
  pending_reminders_count: number;
  monthly_recovery_rate: number;
  escalation_count: number;
  overdue_trend: Array<{ date: string; amount: number }>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
