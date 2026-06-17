export type UserRole = "admin" | "club_leader" | "department_head" | "member";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  student_id?: string;
  phone?: string;
  role: UserRole;
  department?: string;
  club_id?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Club {
  id: string;
  name: string;
  description?: string;
  leader_id: string;
  department?: string;
  logo_url?: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  club_id: string;
  location: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  current_participants: number;
  status: "draft" | "pending" | "approved" | "rejected" | "ongoing" | "completed" | "cancelled";
  category: string;
  cover_image?: string;
  created_by: string;
  reviewed_by?: string;
  review_comment?: string;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  activity_id: string;
  user_id: string;
  status: "registered" | "cancelled" | "waitlisted" | "checked_in";
  registered_at: string;
  cancelled_at?: string;
  check_in_time?: string;
  seat_number?: number;
  has_reminder: boolean;
  reminder_sent?: boolean;
}

export interface CheckInRecord {
  id: string;
  activity_id: string;
  user_id: string;
  check_in_time: string;
  check_in_method: "qrcode" | "manual" | "gps";
  location?: string;
}

export interface Message {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: "system" | "activity" | "reminder" | "review" | "notification";
  related_type?: "activity" | "repair" | "trade" | "verification";
  related_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface RepairRequest {
  id: string;
  title: string;
  description: string;
  dormitory: string;
  room_number: string;
  category: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "processing" | "completed" | "cancelled";
  reporter_id: string;
  handler_id?: string;
  related_activity_id?: string;
  images?: string[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface SecondHandItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: "new" | "like_new" | "good" | "fair";
  images?: string[];
  seller_id: string;
  buyer_id?: string;
  status: "available" | "reserved" | "sold" | "cancelled";
  related_activity_id?: string;
  created_at: string;
  updated_at: string;
}

export interface IdentityVerification {
  id: string;
  user_id: string;
  type: "student" | "club_leader" | "department" | "admin";
  real_name: string;
  student_id?: string;
  department?: string;
  club_id?: string;
  id_card_front?: string;
  id_card_back?: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by?: string;
  review_comment?: string;
  submitted_at: string;
  reviewed_at?: string;
}

export interface SeatViolation {
  id: string;
  user_id: string;
  activity_id: string;
  registration_id: string;
  type: "no_show" | "late" | "cancelled_late";
  count: number;
  description?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}
