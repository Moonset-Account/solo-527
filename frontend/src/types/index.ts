export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export interface User {
  id: number
  name: string
  phone: string
  email?: string
  avatar_url?: string
  role: UserRole
  is_active: boolean
  last_login_at?: string
  created_at: string
}

export interface Teacher {
  id: number
  user_id: number
  user?: User
  bio?: string
  specialties: string[]
  hourly_rate: string
  status: 'pending' | 'active' | 'suspended' | 'resigned'
  hire_date?: string
}

export interface Student {
  id: number
  user_id: number
  user?: User
  birthday?: string
  emergency_contact?: string
  emergency_phone?: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  total_courses: number
  total_spent: string
}

export interface CourseCategory {
  id: number
  name: string
  code: string
  description?: string
  icon_url?: string
  sort_order: number
  is_active: boolean
}

export enum DifficultyLevel {
  VERY_EASY = 0,
  EASY = 1,
  MEDIUM = 2,
  HARD = 3,
  EXPERT = 4
}

export interface Course {
  id: number
  course_category_id: number
  course_category?: CourseCategory
  title: string
  description?: string
  content?: string
  cover_url?: string
  gallery_urls: string[]
  duration_minutes: number
  price: string
  material_fee: string
  difficulty_level: DifficultyLevel
  min_students: number
  max_students: number
  requires_approval: boolean
  is_published: boolean
  tags: string[]
  bookings_count: number
  rating: number
  reviews_count: number
  created_at: string
  average_rating?: number
}

export enum CourseSessionStatus {
  DRAFT = 0,
  SCHEDULED = 1,
  IN_PROGRESS = 2,
  COMPLETED = 3,
  CANCELLED = 4
}

export interface CourseSession {
  id: number
  course_id: number
  course?: Course
  teacher_id: number
  teacher?: Teacher
  material_package_id?: number
  material_package?: MaterialPackage
  start_time: string
  end_time: string
  location: string
  status: CourseSessionStatus
  registered_count: number
  attended_count: number
  notes?: string
  available_slots?: number
}

export enum MaterialPackageStatus {
  ACTIVE = 0,
  LOW_STOCK = 1,
  OUT_OF_STOCK = 2,
  DISCONTINUED = 3
}

export interface MaterialPackage {
  id: number
  name: string
  sku: string
  description?: string
  image_url?: string
  cost_price: string
  sale_price: string
  stock_quantity: number
  reserved_quantity: number
  safety_stock: number
  status: MaterialPackageStatus
  materials: any[]
  available_quantity?: number
}

export enum BookingStatus {
  PENDING = 0,
  APPROVED = 1,
  PAID = 2,
  COMPLETED = 3,
  CANCELLED = 4,
  REJECTED = 5
}

export enum PaymentStatus {
  UNPAID = 0,
  PENDING_PAYMENT = 1,
  PAID = 2,
  REFUNDED = 3,
  PARTIALLY_REFUNDED = 4
}

export enum AttendanceStatus {
  NOT_CHECKED_IN = 0,
  CHECKED_IN = 1,
  ABSENT = 2,
  LATE = 3
}

export interface Booking {
  id: number
  booking_no: string
  student_id: number
  student?: Student
  course_session_id: number
  course_session?: CourseSession
  material_package_id?: number
  material_package?: MaterialPackage
  course_fee: string
  material_fee: string
  total_amount: string
  paid_amount: string
  status: BookingStatus
  payment_status: PaymentStatus
  attendance_status: AttendanceStatus
  paid_at?: string
  cancelled_at?: string
  cancel_reason?: string
  approved_by_id?: number
  approved_at?: string
  notes?: string
  payments?: Payment[]
  created_at: string
  outstanding_amount?: string
  fully_paid?: boolean
  can_cancel?: boolean
  can_pay?: boolean
}

export enum ArtworkStatus {
  DRAFT = 0,
  PENDING_REVIEW = 1,
  PUBLISHED = 2,
  REJECTED = 3,
  ARCHIVED = 4
}

export interface Artwork {
  id: number
  student_id: number
  student?: Student
  course_session_id?: number
  course_session?: CourseSession
  teacher_id?: number
  teacher?: Teacher
  title: string
  description?: string
  image_urls: string[]
  thumbnail_url?: string
  is_public: boolean
  published_at?: string
  likes_count: number
  views_count: number
  status: ArtworkStatus
  tags: string[]
  created_at: string
}

export enum ReviewStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2
}

export interface Review {
  id: number
  student_id: number
  student?: Student
  course_session_id: number
  course_session?: CourseSession
  teacher_id?: number
  teacher?: Teacher
  rating: number
  content?: string
  status: ReviewStatus
  is_anonymous: boolean
  created_at: string
}

export enum PaymentStatusEnum {
  PENDING = 0,
  SUCCESS = 1,
  FAILED = 2,
  REFUNDED = 3
}

export interface Payment {
  id: number
  payment_no: string
  booking_id: number
  booking?: Booking
  student_id: number
  student?: Student
  amount: string
  payment_method: string
  status: PaymentStatusEnum
  transaction_id?: string
  paid_at?: string
  failure_reason?: string
  created_at: string
}

export enum SettlementStatus {
  DRAFT = 0,
  PENDING_APPROVAL = 1,
  APPROVED = 2,
  PAID = 3,
  REJECTED = 4
}

export interface TeacherSettlement {
  id: number
  settlement_no: string
  teacher_id: number
  teacher?: Teacher
  period_start: string
  period_end: string
  total_sessions: number
  total_students: number
  base_amount: string
  bonus_amount: string
  deduction_amount: string
  total_amount: string
  status: SettlementStatus
  approved_by_id?: number
  approved_by?: User
  approved_at?: string
  paid_at?: string
  notes?: string
  details: any[]
  created_at: string
}

export interface Notification {
  id: number
  user_id: number
  title: string
  content?: string
  notification_type: string
  metadata?: any
  read: boolean
  read_at?: string
  created_at: string
}

export interface AuditLog {
  id: number
  user_id?: number
  user?: User
  action: string
  auditable_type: string
  auditable_id: number
  old_values?: any
  new_values?: any
  ip_address?: string
  user_agent?: string
  comment?: string
  created_at: string
}

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  errors?: string[]
  meta?: {
    current_page?: number
    total_pages?: number
    total_count?: number
    per_page?: number
    unread_count?: number
  }
}

export interface PaginationParams {
  page?: number
  per_page?: number
}

export interface LoginData {
  phone: string
  password: string
}

export interface RegisterData {
  name: string
  phone: string
  email?: string
  password: string
  password_confirmation: string
  role?: UserRole
}

export interface AuthResponse {
  token: string
  user: User
  teacher?: Teacher
  student?: Student
}
