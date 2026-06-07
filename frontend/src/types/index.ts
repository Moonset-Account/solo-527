export interface FloorHeatmapCell {
  room_number: string;
  floor: number;
  room_type: string;
  is_vip: boolean;
  is_late_checkout: boolean;
  status: string;
  avg_duration: number | null;
  rework_count: number;
}

export interface ReworkTrendPoint {
  date: string;
  rework_rate_vip: number | null;
  rework_rate_normal: number | null;
  rework_rate_total: number | null;
  avg_duration_vip: number | null;
  avg_duration_normal: number | null;
  top_reasons: { reason: string; count: number }[];
}

export interface ShiftComparisonItem {
  shift: string;
  total_orders: number;
  avg_duration_vip: number | null;
  avg_duration_normal: number | null;
  rework_rate_vip: number | null;
  rework_rate_normal: number | null;
}

export interface CleanerPerformance {
  cleaner_id: number;
  cleaner_name: string;
  shift: string;
  total_orders: number;
  vip_orders: number;
  normal_orders: number;
  avg_duration: number | null;
  avg_duration_vip: number | null;
  avg_duration_normal: number | null;
  rework_count: number;
  rework_rate: number | null;
  rework_rate_vip: number | null;
  rework_rate_normal: number | null;
  handover_count: number;
  handover_from_duration_total: number | null;
  handover_to_duration_total: number | null;
  avg_minutes_after_inspection: number | null;
}

export interface WorkOrderDetail {
  id: number;
  order_number: string;
  room_number: string;
  floor: number;
  room_type: string;
  is_vip: boolean;
  is_late_checkout: boolean;
  cleaner_name: string;
  cleaner_id: number;
  shift: string;
  status: string;
  assigned_at: string | null;
  start_time: string | null;
  end_time: string | null;
  inspection_time: string | null;
  cleaning_duration: number | null;
  date: string | null;
  note: string | null;
  reworks: ReworkDetail[];
  handovers: HandoverDetail[];
}

export interface ReworkDetail {
  id: number;
  reason: string;
  missing_item: string | null;
  rework_time: string | null;
  minutes_after_inspection: number | null;
  reassigned_cleaner_name: string | null;
  rework_duration: number | null;
  is_vip: boolean;
}

export interface HandoverDetail {
  id: number;
  from_cleaner_name: string | null;
  to_cleaner_name: string | null;
  handover_time: string | null;
  from_duration: number | null;
  to_duration: number | null;
  note: string | null;
}

export interface FilterState {
  start_date: string;
  end_date: string;
  floor: number | null;
  shift: string | null;
  is_vip: boolean | null;
  is_late_checkout: boolean | null;
  cleaner_id: number | null;
}

export interface RoomInfo {
  id: number;
  room_number: string;
  floor: number;
  room_type: string;
  is_vip: boolean;
  status: string;
}

export interface CleanerInfo {
  id: number;
  name: string;
  employee_id: string;
  shift: string;
}
