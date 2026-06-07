export interface CarModel {
  id: string;
  name: string;
  brand: string;
  category: string;
}

export interface Store {
  id: string;
  name: string;
  city: string;
}

export interface Salesperson {
  id: string;
  name: string;
  store_id: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  phone_hash: string;
}

export type AppointmentSource = '线上官网' | 'APP' | '小程序' | '到店咨询' | '电话预约' | '老客推荐';
export type AppointmentStatus = '待确认' | '已确认' | '已到店' | '已完成' | '已取消' | '爽约';
export type CancellationReason =
  | '客户主动取消'
  | '车型缺货'
  | '时间冲突'
  | '天气原因'
  | '价格不满意'
  | '竞品选择'
  | '其他';
export type NoShowReason =
  | '忘记预约'
  | '临时有事'
  | '竞品选择'
  | '交通不便'
  | '其他';
export type ConversionType = '到店成交' | '后续成交' | null;

export interface Appointment {
  id: string;
  customer_id: string;
  model_id: string;
  original_model_id: string;
  sales_id: string;
  store_id: string;
  source: AppointmentSource;
  status: AppointmentStatus;
  appointment_time: string;
  created_at: string;
  is_visited: boolean;
  cancellation_reason: CancellationReason | null;
  no_show_reason: NoShowReason | null;
  conversion_type: ConversionType;
  is_vehicle_swapped: boolean;
  is_duplicate_customer: boolean;
  remark: string;
}

export interface FunnelStage {
  name: string;
  count: number;
}

export interface FunnelData {
  stages: FunnelStage[];
  by_model: Record<string, FunnelStage[]>;
}

export interface CancellationDetail {
  reason: string;
  count: number;
  percentage: number;
  is_no_show: boolean;
  model_out_of_stock: number;
  customer_reschedule: number;
}

export interface SalesLoad {
  sales_id: string;
  sales_name: string;
  store_name: string;
  appointment_count: number;
  completed_count: number;
  cancelled_count: number;
  no_show_count: number;
  load_level: 'low' | 'normal' | 'high' | 'overloaded';
  schedule_conflicts: ScheduleConflict[];
}

export interface ScheduleConflict {
  appointment_id_1: string;
  appointment_id_2: string;
  sales_name: string;
  time_1: string;
  time_2: string;
  conflict_type: 'overlap' | 'back_to_back';
}

export interface ConversionData {
  model_id: string;
  model_name: string;
  total_completed: number;
  in_store_conversion: number;
  follow_up_conversion: number;
  in_store_rate: number;
  follow_up_rate: number;
  total_rate: number;
  vehicle_swap_count: number;
  original_model_preserved: number;
}

export interface FilterState {
  model_id: string;
  sales_id: string;
  source: string;
  period_start: string;
  period_end: string;
  store_id: string;
  is_visited: string;
}

export interface ExportReport {
  filename: string;
  sheets: {
    name: string;
    data: Record<string, unknown>[];
  }[];
}
