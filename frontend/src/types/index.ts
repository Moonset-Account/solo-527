export type UserRole = 'admin' | 'teacher' | 'parent';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
}

export interface ClassGroup {
  id: number;
  name: string;
  grade: string;
  teacher: number | null;
  teacher_name: string;
  children_count: number;
  created_at: string;
}

export interface Child {
  id: number;
  name: string;
  gender: 'M' | 'F';
  birth_date: string;
  class_group: number | null;
  class_group_name: string;
  enrollment_date: string;
  allergies: string;
  medical_notes: string;
  emergency_contact: string;
  emergency_phone: string;
  is_active: boolean;
  parents?: ParentInfo[];
  authorized_pickups?: AuthorizedPickupPerson[];
  created_at: string;
  updated_at: string;
}

export interface ParentInfo {
  id: number;
  username: string;
  relation: string;
  is_primary: boolean;
}

export interface AuthorizedPickupPerson {
  id: number;
  child: number;
  name: string;
  relation: string;
  id_number: string;
  phone: string;
  photo?: string;
  is_active: boolean;
  added_by: number | null;
  created_at: string;
}

export interface DailyRecord {
  id: number;
  child: number;
  child_name: string;
  date: string;
  mood: string;
  appetite: string;
  nap_start: string;
  nap_end: string;
  nap_quality: string;
  breakfast: string;
  lunch: string;
  snack: string;
  activities: string;
  notes: string;
  recorded_by: number | null;
  recorded_by_name: string;
  photos: GrowthPhoto[];
  created_at: string;
  updated_at: string;
}

export interface GrowthPhoto {
  id: number;
  record: number;
  image: string;
  caption: string;
  uploaded_by: number | null;
  uploaded_by_name: string;
  created_at: string;
}

export interface PickupRecord {
  id: number;
  child: number;
  child_name: string;
  direction: 'dropoff' | 'pickup';
  authorized_person: number | null;
  authorized_person_name: string;
  actual_person_name: string;
  actual_person_id: string;
  status: 'pending' | 'verified' | 'rejected';
  pickup_time: string;
  verified_by: number | null;
  verified_by_name: string;
  remark: string;
  created_at: string;
}

export interface Notification {
  id: number;
  title: string;
  content: string;
  target_type: 'all' | 'class' | 'individual';
  target_class: number | null;
  target_user: number | null;
  is_urgent: boolean;
  created_by: number | null;
  created_by_name: string;
  is_read: boolean;
  created_at: string;
}

export interface FeeItem {
  id: number;
  name: string;
  fee_type: string;
  amount: string;
  due_date: string;
  class_group: number | null;
  class_group_name: string;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
}

export interface Payment {
  id: number;
  child: number;
  child_name: string;
  fee_item: number;
  fee_item_name: string;
  amount: string;
  paid_amount: string;
  status: 'pending' | 'paid' | 'overdue' | 'waived';
  due_date: string;
  paid_at: string;
  remark: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: number;
  child: number;
  child_name: string;
  requester: number;
  requester_name: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: number | null;
  reviewed_by_name: string;
  review_remark: string;
  created_at: string;
  reviewed_at: string;
}

export interface AuditLog {
  id: number;
  user: number | null;
  action: string;
  model_name: string;
  object_id: string;
  detail: string;
  ip_address: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface TodayPickupStats {
  total: number;
  dropoff: number;
  pickup: number;
  verified: number;
  pending: number;
  rejected: number;
}

export interface UnreadCount {
  total: number;
  unread: number;
}
