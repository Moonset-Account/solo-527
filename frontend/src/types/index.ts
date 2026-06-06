export interface FilterState {
  start_date?: string;
  end_date?: string;
  store_ids?: number[];
  product_ids?: number[];
  product_categories?: string[];
  warehouse_ids?: number[];
  logistics_providers?: string[];
  return_reasons_level1?: string[];
  return_reasons_level2?: string[];
  status?: string[];
}

export interface DashboardOverview {
  total_returns: number;
  total_return_amount: number;
  return_rate: number;
  avg_refund_cycle_days: number;
  avg_service_duration_hours: number;
  repeat_return_user_count: number;
}

export interface ReasonTreeNode {
  name: string;
  value: number;
  amount: number;
  children?: ReasonTreeNode[];
}

export interface CycleDistributionItem {
  bucket: string;
  count: number;
  avg_days: number;
}

export interface ProductRankItem {
  product_id: number;
  product_name: string;
  return_count: number;
  return_rate: number;
  return_amount: number;
}

export interface ServiceDurationItem {
  agent_name?: string;
  avg_duration: number;
  median_duration: number;
  case_count: number;
}

export interface DimensionStats {
  dimension: string;
  id?: number | string;
  name: string;
  count: number;
  amount: number;
  avg_cycle_days: number;
}

export interface ChartDataResponse {
  overview: DashboardOverview;
  reason_tree: ReasonTreeNode[];
  cycle_distribution: CycleDistributionItem[];
  product_ranking: ProductRankItem[];
  service_duration: ServiceDurationItem[];
  dimension_stats: Record<string, DimensionStats[]>;
  applied_filters: Record<string, any>;
}

export interface FilterOption {
  id?: number;
  name: string;
}

export interface FilterOptions {
  stores: FilterOption[];
  warehouses: FilterOption[];
  logistics_providers: FilterOption[];
  product_categories: FilterOption[];
  products: FilterOption[];
  return_reasons_level1: FilterOption[];
}

export interface SavedView {
  id: number;
  name: string;
  filters: FilterState;
  created_at: string;
  updated_at: string;
  is_public: boolean;
}
