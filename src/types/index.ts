export interface FilterParams {
  window_id?: string;
  cuisine_type?: string;
  time_period?: string;
  cost_min?: number;
  cost_max?: number;
  supply_batch?: string;
  date_from?: string;
  date_to?: string;
}

export interface DishSatisfaction {
  dish_id: string;
  dish_name: string;
  window_name: string;
  cuisine_type: string;
  avg_score: number;
  total_sales: number;
  sample_count: number;
  return_count: number;
  return_rate: number;
  cost: number;
  profit_rate: number;
  supplier_changed: boolean;
  batch_recalled: boolean;
}

export interface ReturnReason {
  reason: string;
  count: number;
  ratio: number;
}

export interface ReturnDetail {
  dish_name: string;
  window_name: string;
  date: string;
  reason: string;
  count: number;
}

export interface CostProfit {
  dish_id: string;
  dish_name: string;
  cost: number;
  profit_rate: number;
  sales: number;
}

export interface AbnormalDish {
  dish_id: string;
  dish_name: string;
  window_name: string;
  cuisine_type: string;
  avg_score: number;
  sample_count: number;
  return_rate: number;
  cost: number;
  profit_rate: number;
  abnormal_type: string[];
  supplier_changed: boolean;
  batch_recalled: boolean;
  recall_batch_id?: string;
  supplier_change_date?: string;
}

export interface SupplierChangeEvent {
  id: string;
  window_id: string;
  window_name: string;
  change_date: string;
  old_supplier: string;
  new_supplier: string;
}

export interface BatchRecallEvent {
  id: string;
  batch_id: string;
  ingredient_name: string;
  recall_date: string;
  affected_dishes: { id: string; name: string }[];
}

export interface ScoreTrend {
  dish_id: string;
  dish_name: string;
  dates: string[];
  scores: number[];
  supplier_change_dates: string[];
  recall_dates: string[];
}

export interface FilterOptions {
  windows: { id: string; name: string }[];
  cuisines: string[];
  batches: string[];
  cost_range: { min: number; max: number };
}
