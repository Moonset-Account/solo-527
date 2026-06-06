export interface User {
  id: number
  name: string
  email: string
  phone: string
  role: 'super_admin' | 'admin' | 'teacher' | 'student'
  avatar: string
  created_at: string
}

export interface Teacher {
  id: number
  user_id: number
  name: string
  avatar: string
  bio: string
  specialty: string[]
  hourly_rate: number
  status: 'active' | 'inactive'
}

export interface Course {
  id: number
  title: string
  description: string
  category: 'pottery' | 'silver' | 'leather'
  cover_image: string
  duration: number
  price: number
  max_students: number
  teacher_id: number
  material_kit_id: number
  status: 'draft' | 'published' | 'archived'
  teacher?: Teacher
  material_kit?: MaterialKit
  schedules?: Schedule[]
  average_rating?: number
  reviews_count?: number
  created_at: string
}

export interface Schedule {
  id: number
  course_id: number
  start_time: string
  end_time: string
  location: string
  max_students: number
  enrolled_count?: number
  available_slots?: number
}

export interface MaterialKit {
  id: number
  name: string
  description: string
  cover_image: string
  stock_quantity: number
  warning_threshold: number
  unit_price: number
  status: 'active' | 'out_of_stock' | 'discontinued'
}

export interface Enrollment {
  id: number
  course_id: number
  schedule_id: number
  student_id: number
  material_kit_id: number
  order_no: string
  amount: number
  status: 'pending_payment' | 'paid' | 'completed' | 'cancelled' | 'refunding' | 'refunded' | 'refund_rejected'
  payment_method: string
  paid_at: string
  course?: Course
  schedule?: Schedule
  student?: User
  material_kit?: MaterialKit
  created_at: string
}

export interface Work {
  id: number
  title: string
  description: string
  images: string[]
  student_id: number
  course_id: number
  enrollment_id: number
  is_public: boolean
  authorized_at: string
  authorized_by: number
  status: 'pending' | 'approved' | 'rejected'
  approved_at: string
  approved_by: number
  student?: User
  course?: Course
  created_at: string
}

export interface Review {
  id: number
  enrollment_id: number
  course_id: number
  student_id: number
  teacher_id: number
  rating: number
  content: string
  images: string[]
  created_at: string
}

export interface AuditLog {
  id: number
  action: string
  auditable_type: string
  auditable_id: number
  user_id: number
  user_name: string
  changes: Record<string, any>
  created_at: string
}

export interface DashboardOverview {
  today_enrollments: number
  total_revenue: number
  total_works: number
  new_students: number
  low_stock_materials: number
  pending_works: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    next_page: number | null
    prev_page: number | null
    total_pages: number
    total_count: number
  }
}

export interface ApiResponse<T> {
  data: T
  message?: string
}
