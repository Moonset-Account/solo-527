export type UserRole = "operation" | "frontdesk" | "auditor" | "admin";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department: string | null;
  created_at: string;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  birth_date: string | null;
  gender: "男" | "女" | "其他" | null;
  patient_no: string;
  created_at: string;
}

export type MedicalRecordStatus = "active" | "archived" | "exception";

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  chief_complaint: string;
  diagnosis: string | null;
  prescription: string | null;
  visit_date: string;
  department: string;
  total_fee: string;
  status: MedicalRecordStatus;
  created_at: string;
  patient?: Patient;
  doctor?: User;
  follow_up_plans?: FollowUpPlan[];
  charge_items?: ChargeItem[];
}

export type FollowUpPlanStatus = "pending" | "completed" | "cancelled";
export type FollowUpType = "电话" | "微信" | "到店" | "短信";

export interface FollowUpPlan {
  id: string;
  record_id: string;
  planned_follow_up_date: string;
  follow_up_type: FollowUpType;
  notes: string | null;
  status: FollowUpPlanStatus;
  created_at: string;
}

export type ChargeCategory = "诊费" | "中药" | "理疗" | "检查" | "其他";

export interface ChargeItem {
  id: string;
  record_id: string;
  item_name: string;
  item_category: ChargeCategory;
  quantity: string;
  unit_price: string;
  subtotal: string;
  created_at: string;
}

export type FollowUpTaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "overdue"
  | "cancelled";

export interface FollowUpTask {
  id: string;
  patient_id: string;
  record_id: string | null;
  assigned_to: string | null;
  planned_date: string;
  actual_date: string | null;
  status: FollowUpTaskStatus;
  quality_score: number | null;
  follow_up_method: FollowUpType | null;
  result_notes: string | null;
  created_at: string;
  patient?: Patient;
  assignee?: User;
  record?: MedicalRecord;
}

export type FilterModule =
  | "medical_records"
  | "follow_up_tasks"
  | "patient_statistics"
  | "follow_up_export";

export interface FilterRule {
  id: string;
  user_id: string;
  name: string;
  module: FilterModule;
  filter_conditions: Record<string, unknown>;
  created_at: string;
}

export type ExceptionSeverity = "low" | "medium" | "high" | "critical";
export type ExceptionStatus = "pending" | "processing" | "resolved" | "closed";

export interface PermissionException {
  id: string;
  record_id: string;
  handled_by: string | null;
  exception_type: string;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  handling_conclusion: string | null;
  handled_at: string | null;
  created_at: string;
  record?: MedicalRecord;
  handler?: User;
}

export type AppointmentStatus = "booked" | "attended" | "cancelled" | "no_show";

export interface Appointment {
  id: string;
  patient_id: string | null;
  appointment_date: string;
  time_slot: string;
  doctor_id: string | null;
  status: AppointmentStatus;
  is_no_show: boolean;
  created_at: string;
}

export interface AppointmentReport {
  id: string;
  report_date: string;
  department: string;
  total_slots: number;
  booked_slots: number;
  attended_slots: number;
  utilization_rate: string;
  exception_impact: Record<string, unknown>;
  generated_at: string;
}

export interface DashboardStats {
  todayRecords: number;
  pendingFollowUps: number;
  revisitRate: number;
  churnRate: number;
  todayRecordsDelta: number;
  pendingFollowUpsDelta: number;
  revisitRateDelta: number;
  churnRateDelta: number;
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface TrendData {
  revisit: TrendPoint[];
  churn: TrendPoint[];
}

export interface FollowUpCompletion {
  completed: number;
  pending: number;
  inProgress: number;
  overdue: number;
}
