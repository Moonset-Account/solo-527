export type SafetyStockStatus = "NORMAL" | "WARNING" | "CRITICAL";

export interface SafetyStock {
  _id: string;
  sku: string;
  skuName: string;
  category?: string;
  minQuantity: number;
  maxQuantity?: number;
  reorderPoint: number;
  reorderQuantity: number;
  unit: string;
  supplier?: string;
  leadTimeDays: number;
  reviewPeriodDays: number;
  status: SafetyStockStatus;
  currentStock: number;
  inTransitQuantity: number;
  lastRestockDate?: Date;
  nextReviewDate: Date;
  responsiblePerson: string;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafetyStockDrilldown {
  safetyStock: SafetyStock;
  inventoryList: Array<{
    batchId: string;
    batchNo: string;
    locationCode: string;
    quantity: number;
    expiryDate: Date;
  }>;
  pendingTransfers: Array<{
    transferId: string;
    transferNo: string;
    quantity: number;
    expectedDate: Date;
    status: string;
  }>;
  stockoutHistory: Array<{
    date: Date;
    gapQuantity: number;
    reason?: string;
  }>;
  leadTimeStats: {
    averageLeadTime: number;
    delayedCount: number;
    delays: DelayRecord[];
  };
}

export interface DelayRecord {
  transferNo: string;
  plannedDate: Date;
  actualDate?: Date;
  delayDays: number;
  reason: string;
  reasonCategory:
    | "SUPPLIER_DELAY"
    | "LOGISTICS_DELAY"
    | "QUALITY_ISSUE"
    | "DOCUMENT_ISSUE"
    | "OTHER";
  handler: string;
  handlingTime?: number;
  remark?: string;
}

export interface SafetyStockCreateInput {
  sku: string;
  skuName: string;
  category?: string;
  minQuantity: number;
  maxQuantity?: number;
  reorderPoint: number;
  reorderQuantity: number;
  unit: string;
  supplier?: string;
  leadTimeDays: number;
  reviewPeriodDays: number;
  responsiblePerson: string;
  remark?: string;
}
