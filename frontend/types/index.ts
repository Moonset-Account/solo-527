export interface User {
  id: number
  username: string
  email: string
  full_name: string | null
  phone: string | null
  avatar: string | null
  is_active: boolean
  roles: Role[]
  created_at?: string
  updated_at?: string
}

export interface Role {
  id: number
  name: string
  code: string
  description: string | null
}

export interface UserInfo extends User {
  permissions: string[]
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface PageParams {
  page: number
  page_size: number
}

export interface PageResult<T> {
  total: number
  page: number
  page_size: number
  items: T[]
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface Lease {
  id: number
  lease_no: string
  property_id: number
  tenant_id: number
  lease_type: string
  start_date: string
  end_date: string
  rent_amount: number
  deposit_amount: number
  payment_cycle: string
  payment_day: number
  status: string
  consultant_id: number | null
  sign_date: string | null
  remark: string | null
  created_at?: string
  updated_at?: string
}

export interface Property {
  id: number
  name: string
  code: string
  address: string
  area: number | null
  property_type: string
  floor: number | null
  total_floors: number | null
  owner_id: number
  status: string
  description: string | null
}

export interface Tenant {
  id: number
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  company: string | null
  industry: string | null
}

export interface Owner {
  id: number
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  bank_account: string | null
  bank_name: string | null
}

export interface Bill {
  id: number
  bill_no: string
  lease_id: number
  bill_type: string
  bill_period: string | null
  bill_date: string
  due_date: string
  amount: number
  paid_amount: number
  status: string
  remark: string | null
  created_at?: string
  updated_at?: string
}

export interface BillPayment {
  id: number
  bill_id: number
  payment_no: string
  amount: number
  payment_date: string
  payment_method: string
  payer: string | null
  remark: string | null
}

export interface ExceptionOrder {
  id: number
  order_no: string
  lease_id: number
  bill_id: number | null
  exception_type: string
  title: string
  description: string
  status: string
  priority: string
  assigned_to: number | null
  resolution: string | null
  resolved_at: string | null
  disputed_amount: number | null
  created_at?: string
  updated_at?: string
}

export interface Dictionary {
  id: number
  name: string
  code: string
  description: string | null
  is_active: boolean
  version: number
  items?: DictionaryItem[]
}

export interface DictionaryItem {
  id: number
  dictionary_id: number
  label: string
  value: string
  sort_order: number
  is_active: boolean
  color: string | null
  remark: string | null
}

export interface ValidationRule {
  id: number
  name: string
  code: string
  field_name: string
  rule_type: string
  rule_config: Record<string, any> | null
  error_message: string
  is_active: boolean
  description: string | null
}

export interface OperationLog {
  id: number
  user_id: number | null
  username: string | null
  operation_type: string
  module: string
  description: string | null
  ip_address: string | null
  request_method: string | null
  request_url: string | null
  status: string
  created_at: string
}

export interface CollectionProgress {
  items: CollectionProgressItem[]
  total_amount: number
  total_paid: number
  total_unpaid: number
  overall_rate: number
}

export interface CollectionProgressItem {
  period: string
  total_amount: number
  paid_amount: number
  unpaid_amount: number
  collection_rate: number
  bill_count: number
  paid_count: number
  unpaid_count: number
}

export interface FollowUpRecord {
  id: number
  lease_id: number
  user_id: number
  follow_type: string
  content: string
  next_follow_date: string | null
  created_at?: string
}
