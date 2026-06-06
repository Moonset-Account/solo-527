export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T = any> {
  success: boolean
  message: string
  data: T[]
  total: number
  page: number
  page_size: number
}

export interface Property {
  id: number
  name: string
  community: string
  building?: string
  room_number: string
  address?: string
  area?: number
  bedroom_count: number
  bathroom_count: number
  status: 'active' | 'inactive' | 'maintenance'
  remarks?: string
  created_at?: string
}

export interface RoomStatus {
  id: number
  property_id: number
  date: string
  status: 'occupied' | 'checked_out' | 'cleaning' | 'cleaning_completed' | 'inspecting' | 'available' | 'maintenance' | 'blocked'
  guest_name?: string
  check_in_time?: string
  check_out_time?: string
  current_cleaning_task_id?: number
  remarks?: string
}

export interface CleaningTask {
  id: number
  task_no: string
  property_id: number
  cleaner_id?: number
  created_by: number
  status: 'pending' | 'assigned' | 'in_progress' | 'submitted' | 'inspecting' | 'approved' | 'rejected' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  scheduled_time?: string
  deadline_time?: string
  started_at?: string
  submitted_at?: string
  completed_at?: string
  estimated_duration?: number
  actual_duration?: number
  cleaning_items?: string
  description?: string
  inspector_remarks?: string
  is_overdue: number
  created_at?: string
}

export interface MaintenanceOrder {
  id: number
  order_no: string
  property_id: number
  technician_id?: number
  created_by: number
  status: 'pending' | 'assigned' | 'in_progress' | 'submitted' | 'inspecting' | 'completed' | 'rejected' | 'cancelled'
  maintenance_type: 'plumbing' | 'electrical' | 'appliance' | 'furniture' | 'painting' | 'door_window' | 'other'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  scheduled_time?: string
  deadline_time?: string
  started_at?: string
  submitted_at?: string
  completed_at?: string
  estimated_cost?: number
  actual_cost?: number
  title: string
  description?: string
  solution?: string
  inspector_remarks?: string
  is_overdue: number
  created_at?: string
}

export interface DashboardStats {
  total_cleaning_tasks: number
  completed_cleaning_tasks: number
  overdue_cleaning_tasks: number
  total_maintenance_orders: number
  completed_maintenance_orders: number
  overdue_maintenance_orders: number
  total_cost: number
  cleaner_utilization: number
  technician_utilization: number
}

export interface CleanerPerformance {
  cleaner_id: number
  cleaner_name: string
  total_tasks: number
  completed_tasks: number
  completion_rate: number
  avg_duration_hours: number
  overdue_count: number
  overdue_rate: number
}

export interface Notification {
  id: number
  user_id: number
  title: string
  content?: string
  notification_type?: string
  related_id?: number
  is_read: number
  created_at?: string
}

export interface Material {
  id: number
  name: string
  sku?: string
  category?: string
  unit: string
  unit_price: number
  stock_quantity: number
  description?: string
  created_at?: string
}

export interface Attachment {
  id: number
  cleaning_task_id?: number
  maintenance_order_id?: number
  uploaded_by: number
  object_name: string
  original_filename: string
  content_type?: string
  file_size?: number
  attachment_type?: string
  purpose?: string
  file_url?: string
  created_at?: string
}
