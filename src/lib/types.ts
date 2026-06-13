export type UserRole = "user" | "manager" | "admin";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "conflict";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export type ScheduleType = "regular" | "course" | "maintenance" | "event";

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Court {
  id: string;
  name: string;
  code: string;
  description: string | null;
  capacity: number;
  is_active: boolean;
  floor_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface Coach {
  id: string;
  profile_id: string | null;
  name: string;
  phone: string | null;
  level: string;
  specialty: string | null;
  hourly_rate: number;
  bio: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingRule {
  id: string;
  name: string;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  base_price: number;
  court_type: string | null;
  is_peak: boolean;
  multiplier: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface Schedule {
  id: string;
  court_id: string;
  coach_id: string | null;
  schedule_type: ScheduleType;
  date: string;
  start_time: string;
  end_time: string;
  title: string | null;
  max_participants: number | null;
  course_id: string | null;
  notes: string | null;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  court?: Court;
  coach?: Coach;
  bookings_count?: number;
}

export interface Booking {
  id: string;
  schedule_id: string | null;
  user_id: string;
  court_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  guests_count: number;
  total_price: number;
  discount_amount: number;
  payment_status: PaymentStatus;
  payment_method: string | null;
  transaction_id: string | null;
  paid_at: string | null;
  notes: string | null;
  has_conflict: boolean;
  created_at: string;
  updated_at: string;
  court?: Court;
  user?: Profile;
  schedule?: Schedule;
}

export interface WaitingList {
  id: string;
  schedule_id: string;
  user_id: string;
  position: number;
  preferred_court_id: string | null;
  notified: boolean;
  notified_at: string | null;
  converted: boolean;
  converted_booking_id: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  schedule?: Schedule;
  user?: Profile;
}

export interface CourtConflict {
  id: string;
  court_id: string;
  conflict_date: string;
  start_time: string;
  end_time: string;
  booking_ids: string[];
  description: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution: string | null;
  status: "open" | "in_progress" | "resolved" | "closed";
  synced_to_safety_report: boolean;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
  court?: Court;
  bookings?: Booking[];
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: "create" | "update" | "delete";
  entity_type: string;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface SafetyReport {
  id: string;
  report_date: string;
  court_id: string | null;
  conflict_id: string | null;
  conflict_count: number;
  resolution_summary: string | null;
  equipment_check_notes: string | null;
  court_condition: string | null;
  incident_notes: string | null;
  submitted_by: string | null;
  submitted_at: string;
  synced_from_conflict: boolean;
}

export interface Course {
  id: string;
  name: string;
  description: string | null;
  coach_id: string | null;
  level: string;
  duration_minutes: number;
  price: number;
  max_students: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
