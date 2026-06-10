export type UserRole = 'super_admin' | 'host' | 'operator' | 'receptionist';

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  is_active: boolean;
  date_joined: string;
}

export interface Property {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  phone: string;
  email: string;
  check_in_time: string;
  check_out_time: string;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  property: string;
  name: string;
  description: string;
  room_type: string;
  max_guests: number;
  base_price: number;
  size_sqm: number;
  bed_count: number;
  bathroom_count: number;
  amenities: RoomAmenity[];
  images: RoomImage[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoomAmenity {
  id: string;
  name: string;
  icon?: string;
}

export interface RoomImage {
  id: string;
  image: string;
  caption?: string;
  is_primary: boolean;
}

export type InventoryStatus = 'available' | 'booked' | 'locked' | 'maintenance';

export interface Inventory {
  id: string;
  room: string;
  room_name?: string;
  date: string;
  status: InventoryStatus;
  price: number;
  is_locked: boolean;
  locked_by?: string;
  locked_until?: string;
  order_id?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryConflict {
  id: string;
  room: string;
  date: string;
  conflict_type: string;
  description: string;
  order_ids: string[];
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

export interface SpecialPricing {
  id: string;
  room: string;
  start_date: string;
  end_date: string;
  price: number;
  reason?: string;
  created_at: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
export type ConversionStage = 'inquiry' | 'quoted' | 'deposit_paid' | 'fully_paid' | 'completed' | 'lost';

export interface Order {
  id: string;
  order_number: string;
  property: string;
  room: string;
  room_name?: string;
  guest_name: string;
  guest_phone: string;
  guest_email?: string;
  check_in_date: string;
  check_out_date: string;
  total_nights: number;
  guest_count: number;
  total_amount: number;
  deposit_amount: number;
  status: OrderStatus;
  conversion_stage: ConversionStage;
  special_requests?: string;
  source?: string;
  payments: Payment[];
  timeline: OrderTimeline[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  order: string;
  amount: number;
  payment_method: string;
  transaction_id?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  paid_at?: string;
  created_at: string;
}

export interface OrderTimeline {
  id: string;
  order: string;
  action: string;
  description: string;
  created_by: string;
  created_at: string;
}

export interface ConversionFunnelData {
  stage: ConversionStage;
  stage_name: string;
  count: number;
  amount: number;
  conversion_rate: number;
}

export interface TourRoute {
  id: string;
  property: string;
  name: string;
  description: string;
  duration_minutes: number;
  waypoints: TourWaypoint[];
  is_active: boolean;
  version: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TourWaypoint {
  id: string;
  route: string;
  name: string;
  description?: string;
  duration_minutes: number;
  order_index: number;
  location?: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface CleaningTask {
  id: string;
  property: string;
  room: string;
  room_name?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to?: string;
  scheduled_date: string;
  completed_at?: string;
  completed_by?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ItineraryStatus = 'draft' | 'published' | 'archived';

export interface ItineraryVersion {
  id: string;
  property: string;
  name: string;
  description: string;
  version_number: string;
  status: ItineraryStatus;
  content: Record<string, unknown>;
  parent_version?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ReminderLevel = 1 | 2 | 3 | 4;

export interface ReminderRule {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_condition: Record<string, unknown>;
  level: ReminderLevel;
  time_limit_minutes: number;
  escalation_level?: ReminderLevel;
  is_active: boolean;
  color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ReminderStatus = 'pending' | 'acknowledged' | 'resolved' | 'escalated';

export interface Reminder {
  id: string;
  rule: string;
  rule_name?: string;
  level: ReminderLevel;
  title: string;
  message: string;
  status: ReminderStatus;
  related_type?: string;
  related_id?: string;
  is_overdue: boolean;
  due_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  escalated_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user: string;
  username?: string;
  action: 'create' | 'update' | 'delete';
  model_name: string;
  object_id: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  field_diffs?: Array<{
    field: string;
    old_value: unknown;
    new_value: unknown;
    diff_html?: string;
  }>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail: string;
  code?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface CalendarData {
  [date: string]: {
    [roomId: string]: Inventory;
  };
}

export interface BookingFormData {
  property_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  guest_name: string;
  guest_phone: string;
  guest_email?: string;
  guest_count: number;
  special_requests?: string;
}
