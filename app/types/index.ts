export type UserRole = "engineer" | "supervisor" | "warehouse" | "finance";

export type BorrowOrderStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "picked"
  | "extended"
  | "returned"
  | "damaged"
  | "lost";

export type DepositStatus = "unfrozen" | "frozen" | "deducted" | "refunded";

export interface User {
  id: string;
  username: string;
  real_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  region?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SparePart {
  id: string;
  part_code: string;
  part_name: string;
  category?: string;
  specification?: string;
  unit: string;
  price: number;
  deposit_ratio: number;
  photo_url?: string;
  description?: string;
  total_available?: number;
  total_locked?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Inventory {
  id: string;
  part_id: string;
  batch_no: string;
  quantity: number;
  available_quantity: number;
  locked_quantity: number;
  location?: string;
  expire_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface BorrowOrder {
  id: string;
  order_no: string;
  applicant_id: string;
  supervisor_id?: string;
  part_id: string;
  inventory_id?: string;
  batch_no?: string;
  quantity: number;
  expected_return_date: Date;
  actual_return_date?: Date;
  work_order_no?: string;
  customer_machine_no?: string;
  customer_name?: string;
  borrow_reason: string;
  status: BorrowOrderStatus;
  deposit_amount: number;
  deposit_status: DepositStatus;
  damage_amount: number;
  rejection_reason?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ReturnRecord {
  id: string;
  borrow_order_id: string;
  returned_quantity: number;
  damaged_quantity?: number;
  lost_quantity?: number;
  inspection_result?: string;
  inspector_id?: string;
  warehouse_operator_id?: string;
  photos?: string[];
  created_at: Date;
}

export interface ExtensionRecord {
  id: string;
  borrow_order_id: string;
  original_return_date: Date;
  new_return_date: Date;
  reason: string;
  approver_id?: string;
  approved: boolean;
  created_at: Date;
}

export interface DepositTransaction {
  id: string;
  borrow_order_id: string;
  transaction_type: "freeze" | "unfreeze" | "deduct" | "refund";
  amount: number;
  operator_id?: string;
  remark?: string;
  created_at: Date;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string;
  related_order_id?: string;
  is_read: boolean;
  read_at?: Date;
  created_at: Date;
}
