export type UserRole = 'customer' | 'admin' | 'technician';

export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export type RepairStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface MemberPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  benefits: string;
  is_active: boolean;
  created_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  balance: number;
  status: string;
  plan?: MemberPlan;
  created_at: string;
  updated_at: string;
}

export interface ServiceTemplate {
  id: string;
  name: string;
  category: string;
  price: number;
  duration_minutes: number;
  description: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Technician {
  id: string;
  name: string;
  phone: string;
  skills: string;
  avatar_url?: string;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Station {
  id: string;
  name: string;
  type: string;
  status: string;
  equipment: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Part {
  id: string;
  name: string;
  sku: string;
  category: string;
  cost_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  unit: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  appointment_id: string;
  template_id: string;
  item_name: string;
  price: number;
  quantity: number;
  technician_id?: string;
  status: string;
  result?: string;
  parts?: OrderPart[];
  created_at: string;
}

export interface OrderPart {
  id: string;
  order_item_id: string;
  appointment_id: string;
  part_id: string;
  part_name: string;
  price: number;
  quantity: number;
  created_at: string;
}

export interface Appointment {
  id: string;
  user_id?: string;
  technician_id?: string;
  station_id?: string;
  appointment_time: string;
  status: AppointmentStatus;
  car_plate: string;
  car_model: string;
  mileage: number;
  customer_name: string;
  customer_phone: string;
  notes?: string;
  total_amount: number;
  quality_score?: number;
  technician?: Technician;
  station?: Station;
  items?: OrderItem[];
  parts?: OrderPart[];
  invoices?: Invoice[];
  repairs?: Repair[];
  attachments?: Attachment[];
  notes_list?: Note[];
  audit_logs?: AuditLog[];
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  appointment_id: string;
  invoice_no: string;
  total_amount: number;
  discount: number;
  member_discount: number;
  final_amount: number;
  status: InvoiceStatus;
  issued_at?: string;
  paid_at?: string;
  payment_method?: string;
  cashier_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Repair {
  id: string;
  appointment_id: string;
  reason: string;
  status: RepairStatus;
  assigned_to?: string;
  priority: string;
  solution?: string;
  quality_score?: number;
  technician?: Technician;
  appointment?: Appointment;
  logs?: RepairLog[];
  created_at: string;
  updated_at: string;
}

export interface RepairLog {
  id: string;
  repair_id: string;
  operator_id?: string;
  action: string;
  description?: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  appointment_id?: string;
  repair_id?: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  uploaded_by?: string;
  created_at: string;
}

export interface Note {
  id: string;
  appointment_id?: string;
  repair_id?: string;
  author_id?: string;
  content: string;
  is_internal: boolean;
  author?: User;
  created_at: string;
}

export interface AuditLog {
  id: string;
  appointment_id?: string;
  repair_id?: string;
  operator_id?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  operator?: User;
  created_at: string;
}

export interface DashboardStats {
  today_appointments: number;
  today_revenue: number;
  pending_repairs: number;
  total_members: number;
  active_stations: number;
  completion_rate: number;
}

export interface RepurchaseReport {
  total_customers: number;
  repeat_customers: number;
  repurchase_rate: number;
  avg_repurchase_cycle: number;
  total_visits: number;
  avg_visits_per_customer: number;
  monthly_data: {
    month: string;
    new_customers: number;
    repeat_customers: number;
    revenue: number;
  }[];
}

export interface QualityReport {
  total_services: number;
  repair_count: number;
  repair_rate: number;
  avg_quality_score: number;
  technician_performance: {
    technician_id: string;
    technician_name: string;
    total_services: number;
    repair_count: number;
    avg_score: number;
  }[];
}
