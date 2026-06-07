export interface SKU {
  id: string;
  name: string;
  category: string;
  unit: string;
  safetyStock: number;
  shelfLifeDays: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
}

export interface WarehouseLocation {
  id: string;
  code: string;
  zone: string;
  aisle: string;
}

export interface Batch {
  id: string;
  skuId: string;
  batchNo: string;
  productionDate: string;
  expiryDate: string;
  receivedDate: string;
  quantity: number;
  locationId: string;
  supplierId: string;
}

export interface InventoryItem {
  id: string;
  skuId: string;
  skuName: string;
  batchId: string;
  batchNo: string;
  locationId: string;
  locationCode: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  availableQty: number;
  reservedQty: number;
  ageDays: number;
  productionDate: string;
  expiryDate: string;
  daysToExpiry: number;
  receivedDate: string;
  unitCost: number;
  totalValue: number;
}

export interface InboundRecord {
  id: string;
  skuId: string;
  skuName: string;
  batchId: string;
  quantity: number;
  receivedDate: string;
  supplierId: string;
  supplierName: string;
}

export interface OutboundRecord {
  id: string;
  skuId: string;
  skuName: string;
  batchId: string;
  quantity: number;
  shippedDate: string;
  destination: string;
}

export interface ReturnRecord {
  id: string;
  skuId: string;
  skuName: string;
  batchId: string;
  quantity: number;
  returnDate: string;
  reason: string;
}

export interface TurnoverMetric {
  skuId: string;
  skuName: string;
  category: string;
  totalInbound: number;
  totalOutbound: number;
  avgInventory: number;
  turnoverRate: number;
  turnoverDays: number;
  ranking: number;
}

export interface ReplenishmentSuggestion {
  skuId: string;
  skuName: string;
  category: string;
  currentStock: number;
  safetyStock: number;
  avgDailyDemand: number;
  daysOfSupply: number;
  suggestedQty: number;
  priority: 'high' | 'medium' | 'low';
  supplierId: string;
  supplierName: string;
}

export interface FilterState {
  skuIds: string[];
  locationIds: string[];
  supplierIds: string[];
  batchIds: string[];
  ageRange: [number, number] | null;
  timeWindow: '7d' | '30d' | '90d' | '180d' | '1y' | 'all';
  dateRange: { start: string; end: string } | null;
  categories: string[];
  zones: string[];
}

export interface FunnelData {
  stage: string;
  value: number;
  description: string;
}

export interface AgeDistribution {
  range: string;
  minDays: number;
  maxDays: number;
  count: number;
  quantity: number;
  value: number;
  isNearExpiry?: boolean;
}

export interface SampleInfo {
  totalRecords: number;
  filteredRecords: number;
  cacheTime: string;
  dataFreshness: string;
}
