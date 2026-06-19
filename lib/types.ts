export type UserRole =
  | 'store_manager'
  | 'warehouse'
  | 'inspector'
  | 'team_lead'
  | 'reception';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Vehicle {
  id: string;
  plate_number: string;
  brand: string;
  model: string;
  vin: string;
  owner_name: string;
  owner_phone: string;
  created_by: string;
  created_at: string;
}

export interface Part {
  id: string;
  part_code: string;
  name: string;
  category: string;
  stock: number;
  unit_price: number;
  unit: string;
  min_stock: number;
  created_at: string;
}

export type TurnoverType = 'in' | 'out' | 'transfer';

export interface PartTurnover {
  id: string;
  part_id: string;
  part_name?: string;
  type: TurnoverType;
  quantity: number;
  workorder_id?: string;
  workorder_title?: string;
  operator_id: string;
  operator_name?: string;
  remark?: string;
  created_at: string;
}

export type WorkOrderStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'quality_check'
  | 'completed'
  | 'cancelled';

export interface WorkOrder {
  id: string;
  vehicle_id: string;
  vehicle_plate?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  team_id?: string;
  team_name?: string;
  assignee_id?: string;
  assignee_name?: string;
  created_at: string;
  completed_at?: string;
}

export type NodeStatus = 'pending' | 'in_progress' | 'completed';

export interface ProductionNode {
  id: string;
  workorder_id: string;
  workorder_title?: string;
  node_name: string;
  sequence: number;
  status: NodeStatus;
  started_at?: string;
  completed_at?: string;
  operator_id?: string;
  operator_name?: string;
}

export interface TeamSchedule {
  id: string;
  team_id: string;
  team_name?: string;
  workorder_id: string;
  workorder_title?: string;
  start_time: string;
  end_time: string;
  assignee_ids: string[];
  assignee_names?: string[];
  created_at: string;
}

export interface QualityItem {
  name: string;
  result: 'pass' | 'fail';
  issue?: string;
  rectification?: string;
}

export type OverallResult = 'pass' | 'fail' | 'rework';

export interface QualityInspection {
  id: string;
  workorder_id: string;
  workorder_title?: string;
  inspector_id: string;
  inspector_name?: string;
  items: QualityItem[];
  overall_result: OverallResult;
  remark?: string;
  created_at: string;
}

export interface AffectedObject {
  type: 'vehicle' | 'part' | 'workorder';
  id: string;
  name: string;
}

export type ChangeStatus = 'open' | 'processing' | 'closed';

export interface OrderChange {
  id: string;
  workorder_id?: string;
  workorder_title?: string;
  change_type: string;
  content: string;
  affected_objects: AffectedObject[];
  responsible_id: string;
  responsible_name?: string;
  status: ChangeStatus;
  close_note?: string;
  closed_at?: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
}

export interface CompensationRecord {
  id: string;
  callback_record_id: string;
  action: string;
  executed_by: string;
  executed_by_name?: string;
  executed_at: string;
  result: 'success' | 'failed';
  remark?: string;
}

export type CallbackStatus = 'pending' | 'success' | 'failed';

export interface CallbackRecord {
  id: string;
  source: string;
  event_type: string;
  payload: Record<string, unknown>;
  status: CallbackStatus;
  failure_reason?: string;
  retry_count: number;
  compensation_records: CompensationRecord[];
  created_at: string;
  processed_at?: string;
}
