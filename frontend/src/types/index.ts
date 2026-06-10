export type UserRole = 'super_admin' | 'host' | 'operator' | 'receptionist';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  role_display?: string;
  phone?: string;
  real_name?: string;
  avatar?: string;
  permissions?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
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
  order_no: string;
  room: string;
  room_name?: string;
  property_name?: string;
  guest_name: string;
  guest_phone: string;
  guest_email?: string;
  guest_remarks?: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  adults: number;
  children: number;
  base_amount: number;
  extra_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  is_paid: boolean;
  status: OrderStatus;
  status_display?: string;
  conversion_stage: ConversionStage;
  conversion_stage_display?: string;
  source?: string;
  source_display?: string;
  internal_remarks?: string;
  handled_by?: string;
  handled_by_name?: string;
  checked_in_at?: string;
  checked_out_at?: string;
  cancelled_at?: string;
  cancelled_reason?: string;
  payments: Payment[];
  timeline: OrderTimeline[];
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  order: string;
  amount: number;
  method: string;
  method_display?: string;
  transaction_no?: string;
  remarks?: string;
  operator?: string;
  operator_name?: string;
  paid_at?: string;
  created_at: string;
}

export interface OrderTimeline {
  id: string;
  order: string;
  action: string;
  description: string;
  operator?: string;
  operator_name?: string;
  created_at: string;
}

export interface ConversionFunnelData {
  stage: string;
  stage_display: string;
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
  trigger_type_display?: string;
  level: ReminderLevel;
  level_display?: string;
  time_limit_minutes: number;
  trigger_condition: Record<string, unknown>;
  conditions: Record<string, unknown>;
  actions: unknown[];
  escalation_level?: ReminderLevel;
  is_active: boolean;
  color: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export type ReminderStatus = 'pending' | 'processing' | 'resolved' | 'ignored';

export interface Reminder {
  id: string;
  rule?: string;
  rule_name?: string;
  level: ReminderLevel;
  level_display?: string;
  color: string;
  title: string;
  content: string;
  status: ReminderStatus;
  status_display?: string;
  related_type?: string;
  related_type_display?: string;
  related_id?: string;
  time_limit?: string;
  is_overdue: boolean;
  remaining_minutes?: number;
  escalated: boolean;
  original_level?: ReminderLevel;
  created_at: string;
  handled_by?: string;
  handled_by_name?: string;
  handled_at?: string;
  handle_notes?: string;
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
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  guest_name: string;
  guest_phone: string;
  guest_email?: string;
  adults: number;
  children: number;
  guest_remarks?: string;
}
