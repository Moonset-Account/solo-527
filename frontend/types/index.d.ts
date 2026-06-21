declare module 'naive-ui'
declare module '@css-render/vue3-ssr'
declare module '@vicons/ionicons5'
declare module 'echarts'
declare module 'vue-echarts'

interface User {
  id: number
  username: string
  full_name: string
  email?: string
  role: string
  store_id?: number
  is_active: boolean
  created_at: string
}

interface Store {
  id: number
  name: string
  address?: string
  phone?: string
  manager_id?: number
  is_active: boolean
}

interface Product {
  id: number
  name: string
  sku?: string
  category?: string
  unit: string
  standard_cost: number
  selling_price: number
  is_active: boolean
}

interface Ingredient {
  id: number
  name: string
  sku?: string
  category?: string
  unit: string
  unit_price: number
  min_stock: number
  is_active: boolean
}

interface BakingBatch {
  id: number
  batch_no: string
  store_id: number
  product_id: number
  baker_id?: number
  planned_quantity: number
  actual_quantity?: number
  start_time?: string
  end_time?: string
  status: string
  temperature?: number
  humidity?: number
  baking_time?: number
  remark?: string
  product?: Product
  baker?: User
}

interface LossRecord {
  id: number
  store_id: number
  batch_id?: number
  ingredient_id?: number
  loss_type: string
  quantity: number
  unit?: string
  unit_price: number
  total_amount: number
  reported_by?: number
  handler_id?: number
  remark?: string
  handle_result?: string
  handled_at?: string
  created_at: string
}

interface InventoryItem {
  id: number
  store_id: number
  ingredient_id: number
  quantity: number
  min_stock: number
  status: string
  last_restocked?: string
  last_check?: string
  remark?: string
  ingredient?: Ingredient
}

interface StockAlert {
  id: number
  inventory_item_id: number
  store_id?: number
  alert_level: string
  current_quantity?: number
  min_stock?: number
  handler_id?: number
  remark?: string
  handle_result?: string
  is_handled: boolean
  handled_at?: string
  created_at: string
}

interface InspectionTask {
  id: number
  task_no: string
  store_id: number
  supervisor_id?: number
  store_manager_id?: number
  title: string
  description?: string
  check_items?: any
  status: string
  scheduled_date?: string
  actual_start?: string
  actual_end?: string
  score?: number
  remark?: string
}

interface RectificationTask {
  id: number
  rectification_no: string
  inspection_id: number
  assignee_id?: number
  supervisor_id?: number
  title: string
  description?: string
  requirement?: string
  deadline?: string
  status: string
  rectification_result?: string
  re_inspection_result?: string
  completed_at?: string
  re_inspected_at?: string
}

interface CashFlow {
  id: number
  store_id: number
  flow_type: string
  amount: number
  category?: string
  description?: string
  operator_id?: number
  transaction_time?: string
  remark?: string
}

interface LaborRecord {
  id: number
  store_id: number
  user_id: number
  work_date: string
  start_time?: string
  end_time?: string
  regular_hours: number
  overtime_hours: number
  hourly_rate: number
  overtime_rate: number
  total_amount: number
  work_content?: string
}

interface SystemSetting {
  id: number
  module: string
  key: string
  value?: string
  value_type: string
  description?: string
  is_enabled: boolean
}
