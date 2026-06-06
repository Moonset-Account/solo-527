export interface User {
  id: number
  phone: string
  name: string
  role: 'director' | 'teacher' | 'parent'
  role_display: string
  avatar: string | null
  is_active: boolean
  teacher_profile?: TeacherProfile
  parent_profile?: ParentProfile
}

export interface TeacherProfile {
  id: number
  employee_id: string
  classes: number[]
  class_names: string[]
  position: string
}

export interface ParentProfile {
  id: number
  relation: string
  id_card: string
  address: string
}

export interface ChildClass {
  id: number
  name: string
  capacity: number
  description: string
  student_count: number
}

export interface Child {
  id: number
  name: string
  gender: 'male' | 'female'
  gender_display: string
  birth_date: string
  age: number
  avatar: string | null
  child_class: number
  class_name: string
  enrollment_date: string
  status: 'active' | 'graduated' | 'suspended'
  status_display: string
  id_card: string
  allergies: string
  medical_notes: string
  emergency_contact: string
  emergency_phone: string
}

export interface AuthorizedPerson {
  id: number
  child: number
  child_name: string
  name: string
  phone: string
  id_card: string
  relation: string
  photo: string | null
  is_active: boolean
  is_active_display: string
  expires_at: string | null
  created_at: string
}

export interface PickupRecord {
  id: number
  child: number
  child_name: string
  pickup_type: 'dropoff' | 'pickup'
  pickup_type_display: string
  pickup_time: string | null
  pickup_person_name: string
  pickup_person_phone: string
  pickup_person_relation: string
  authorized_person: number | null
  status: 'pending' | 'verified' | 'rejected' | 'cancelled'
  status_display: string
  verified_by: number | null
  verified_by_name: string | null
  verified_at: string | null
  reject_reason: string
  notes: string
  temperature: number | null
  photos: string[]
  created_at: string
  created_by: number | null
}

export interface DailyRecord {
  id: number
  child: number
  child_name: string
  record_date: string
  teacher: number | null
  teacher_name: string | null
  mood: string
  health_status: string
  notes: string
  nap_records: NapRecord[]
  meal_records: MealRecord[]
  activity_records: ActivityRecord[]
  created_at: string
}

export interface NapRecord {
  id: number
  daily_record: number
  start_time: string
  end_time: string | null
  quality: 'good' | 'normal' | 'poor'
  quality_display: string
  notes: string
}

export interface MealRecord {
  id: number
  daily_record: number
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  meal_type_display: string
  menu: string
  appetite: 'good' | 'normal' | 'poor'
  appetite_display: string
  portion: number | null
  notes: string
}

export interface ActivityRecord {
  id: number
  daily_record: number
  activity_type: string
  description: string
  duration: number | null
  photos: string[]
  notes: string
}

export interface GrowthRecord {
  id: number
  child: number
  child_name: string
  record_date: string
  height: number | null
  weight: number | null
  head_circumference: number | null
  bmi: number | null
  teacher: number | null
  teacher_name: string | null
  notes: string
}

export interface Notification {
  id: number
  title: string
  content: string
  type: 'system' | 'urgent' | 'daily' | 'activity' | 'payment'
  type_display: string
  status: 'draft' | 'published' | 'cancelled'
  status_display: string
  target_type: 'all' | 'class' | 'child' | 'user'
  target_type_display: string
  target_classes: number[]
  target_children: number[]
  target_users: number[]
  published_at: string | null
  published_by: number | null
  published_by_name: string | null
  need_ack: boolean
  deadline: string | null
  attachments: NotificationAttachment[]
  read_count: number
  is_read: boolean
  is_ack: boolean
  created_at: string
}

export interface NotificationAttachment {
  id: number
  notification: number
  file: string
  file_name: string
  file_size: number
}

export interface Message {
  id: number
  sender: number
  sender_name: string
  receiver: number
  receiver_name: string
  content: string
  type: 'text' | 'image' | 'voice'
  type_display: string
  attachment: string | null
  is_read: boolean
  read_at: string | null
  related_child: number | null
  child_name: string | null
  created_at: string
}

export interface Conversation {
  user: {
    id: number
    name: string
    avatar: string | null
    role: string
  }
  last_message: Message
  unread_count: number
}

export interface PaymentItem {
  id: number
  name: string
  description: string
  default_amount: number
  is_active: boolean
}

export interface Invoice {
  id: number
  child: number
  child_name: string
  item: number
  item_name: string
  amount: number
  paid_amount: number
  remaining_amount: number
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded'
  status_display: string
  bill_date: string
  due_date: string
  paid_at: string | null
  paid_by: number | null
  paid_by_name: string | null
  payment_method: string
  notes: string
  reminder_sent: boolean
  last_reminder_at: string | null
  payment_records: PaymentRecord[]
  created_at: string
}

export interface PaymentRecord {
  id: number
  invoice: number
  amount: number
  payment_method: string
  transaction_id: string
  paid_at: string
  paid_by: number | null
  paid_by_name: string | null
  notes: string
}

export interface LeaveRequest {
  id: number
  child: number
  child_name: string
  leave_type: 'sick' | 'personal' | 'other'
  leave_type_display: string
  start_date: string
  end_date: string
  start_session: 'full' | 'morning' | 'afternoon'
  start_session_display: string
  end_session: 'full' | 'morning' | 'afternoon'
  end_session_display: string
  total_days: number
  reason: string
  attachments: string[]
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  status_display: string
  submitted_by: number
  submitted_by_name: string
  reviewed_by: number | null
  reviewed_by_name: string | null
  reviewed_at: string | null
  review_comment: string
  created_at: string
}

export interface DashboardOverview {
  total_children?: number
  today_dropoff?: number
  today_pickup?: number
  pending_pickup?: number
  pending_leave?: number
  today_leave?: number
  pending_payment?: number
  overdue_payment?: number
  total_receivable?: number
  recent_notifications: number
}

export interface PickupTrendItem {
  date: string
  dropoff: number
  pickup: number
}

export interface ClassUtilization {
  id: number
  name: string
  capacity: number
  current: number
  utilization: number
}

export interface StatusBreakdown {
  pickup_status: { status: string; count: number }[]
  leave_status: { status: string; count: number }[]
  payment_status: { status: string; count: number }[]
}

export interface ApiResponse<T = any> {
  count?: number
  next?: string | null
  previous?: string | null
  results: T
}
