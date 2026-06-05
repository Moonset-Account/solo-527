export type UserRole = 'member' | 'operator' | 'admin';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  name: string;
  phone: string;
  points: number;
  created_at: string;
  updated_at: string;
}

export type EquipmentType = 'tractor' | 'transplanter' | 'drone' | 'other';
export type EquipmentStatus = 'available' | 'in_use' | 'maintenance' | 'broken';

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  model: string;
  serial_number: string;
  purchase_date: string;
  purchase_price: number;
  status: EquipmentStatus;
  total_hours: number;
  created_at: string;
  updated_at: string;
}

export interface Field {
  id: string;
  name: string;
  area: number;
  location: string;
  polygon_coords: any;
  soil_type: string;
  owner_id: string;
  created_at: string;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'queued';
export type PriceType = 'self_use' | 'cooperative_subsidy' | 'cross_village';

export interface Reservation {
  id: string;
  user_id: string;
  equipment_id: string;
  field_id: string;
  crop_type: string;
  start_time: string;
  end_time: string;
  status: ReservationStatus;
  price_type: PriceType;
  estimated_price: number;
  is_cancelled: boolean;
  cancel_reason: string;
  is_rain_cancel: boolean;
  queue_position: number;
  created_at: string;
  updated_at: string;
}

export type WorkOrderStatus = 'assigned' | 'accepted' | 'in_progress' | 'completed';

export interface WorkOrder {
  id: string;
  reservation_id: string;
  operator_id: string;
  route_info: any;
  status: WorkOrderStatus;
  assigned_at: string;
  completed_at: string;
}

export interface WorkRecord {
  id: string;
  reservation_id: string;
  equipment_id: string;
  field_id: string;
  operator_id: string;
  fuel_consumption: number;
  work_hours: number;
  photos: string[];
  notes: string;
  completed_at: string;
}

export type MaintenanceStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface MaintenanceTicket {
  id: string;
  equipment_id: string;
  reported_by: string;
  title: string;
  description: string;
  status: MaintenanceStatus;
  cost: number;
  reported_at: string;
  resolved_at: string;
}

export type SettlementStatus = 'pending' | 'confirmed' | 'paid';

export interface Settlement {
  id: string;
  reservation_id: string;
  user_id: string;
  price_type: PriceType;
  base_price: number;
  subsidy_amount: number;
  total_amount: number;
  points_deducted: number;
  status: SettlementStatus;
  created_at: string;
  confirmed_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  before_data: any;
  after_data: any;
  ip_address: string;
  created_at: string;
}

export interface ReservationQueue {
  id: string;
  reservation_id: string;
  priority: number;
  status: 'waiting' | 'promoted' | 'cancelled';
  queued_at: string;
}
