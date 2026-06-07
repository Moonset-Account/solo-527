export interface Book {
  id: number;
  isbn: string;
  title: string;
  author?: string;
  publisher?: string;
  publish_date?: string;
  is_set: boolean;
  set_count: number;
  category?: string;
  cover_image?: string;
  description?: string;
  suggested_price_new?: number;
  suggested_price_like_new?: number;
  suggested_price_good?: number;
  suggested_price_fair?: number;
  suggested_price_poor?: number;
  created_at: string;
  updated_at?: string;
}

export interface RecycleRecord {
  id: number;
  record_no: string;
  book_id: number;
  isbn: string;
  condition: string;
  recycle_price: number;
  logistics_cost: number;
  other_cost: number;
  total_cost: number;
  channel: string;
  operator?: string;
  recycle_date: string;
  in_stock_date?: string;
  sale_date?: string;
  is_sold: boolean;
  sale_price?: number;
  days_in_stock: number;
  is_abnormal: boolean;
  abnormal_reason?: string;
  pricing_version?: string;
  created_at: string;
  updated_at?: string;
}

export interface PriceScatterData {
  isbn: string;
  title: string;
  condition: string;
  recycle_price: number;
  suggested_price?: number;
  sale_price?: number;
  channel: string;
  days_in_stock: number;
  is_abnormal: boolean;
  is_set: boolean;
  record_no: string;
  profit_margin?: number;
}

export interface BookAnalysisData {
  isbn: string;
  title: string;
  condition: string;
  avg_recycle_price: number;
  avg_sale_price?: number;
  avg_profit_margin?: number;
  avg_days_in_stock: number;
  total_count: number;
  sold_count: number;
  unsold_count: number;
  turnover_rate: number;
  avg_logistics_cost: number;
  channels: string[];
}

export interface FilterParams {
  channels?: string[];
  conditions?: string[];
  min_days_in_stock?: number;
  max_days_in_stock?: number;
  min_recycle_price?: number;
  max_recycle_price?: number;
  only_abnormal: boolean;
  only_unsold: boolean;
  isbn_keyword?: string;
  title_keyword?: string;
  start_date?: string;
  end_date?: string;
  category?: string;
}

export interface ExportParams extends FilterParams {
  export_type?: string;
  pricing_version?: string;
}

export interface PricingHistory {
  id: number;
  book_id: number;
  isbn: string;
  condition: string;
  old_price: number;
  new_price: number;
  price_change: number;
  change_percent?: number;
  operator: string;
  change_reason?: string;
  effective_date: string;
  version: string;
  created_at: string;
}

export interface SaleStats {
  period: string;
  avg_sale_price?: number;
  total_sales: number;
  avg_days_in_stock?: number;
  profit_margin?: number;
}

export interface PriceComparison {
  isbn: string;
  title: string;
  condition: string;
  before_price: number;
  after_price: number;
  price_change: number;
  change_percent: number;
  before_stats: SaleStats;
  after_stats: SaleStats;
  operator: string;
  change_reason?: string;
  effective_date: string;
  version: string;
}

export interface SummaryData {
  total_records: number;
  total_books: number;
  sold_count: number;
  unsold_count: number;
  unsold_over_threshold: number;
  unsold_threshold_days: number;
  abnormal_count: number;
  avg_profit_margin?: number;
  channels: string[];
  conditions: string[];
}

export interface BookPriceUpdate {
  condition: string;
  new_price: number;
  operator: string;
  change_reason?: string;
}

export const CONDITIONS = [
  { value: '全新', label: '全新' },
  { value: '九成新', label: '九成新' },
  { value: '八成新', label: '八成新' },
  { value: '七成新', label: '七成新' },
  { value: '六成新及以下', label: '六成新及以下' },
];

export const CHANNELS = [
  { value: '上门回收', label: '上门回收' },
  { value: '邮寄回收', label: '邮寄回收' },
  { value: '门店回收', label: '门店回收' },
  { value: '线上平台', label: '线上平台' },
];

export const CONDITION_COLORS: Record<string, string> = {
  '全新': '#52c41a',
  '九成新': '#1890ff',
  '八成新': '#faad14',
  '七成新': '#fa8c16',
  '六成新及以下': '#f5222d',
};
