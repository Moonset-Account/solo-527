export type BatchStatus =
  | "RECEIVING"
  | "QUALITY_CHECK"
  | "STORED"
  | "PARTIAL_OUT"
  | "EXPIRED"
  | "SCRAPPED"
  | "EMPTY";

export interface Batch {
  _id: string;
  batchNo: string;
  sku: string;
  skuName: string;
  supplier: string;
  supplierBatchNo?: string;
  productionDate: Date;
  expiryDate: Date;
  quantity: number;
  receivedQuantity: number;
  unit: string;
  temperatureZone: "FROZEN" | "CHILLED" | "NORMAL";
  storageConditions?: string;
  status: BatchStatus;
  qualityReport?: string;
  inboundOrderNo?: string;
  operator: string;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BatchCreateInput {
  batchNo: string;
  sku: string;
  skuName: string;
  supplier: string;
  supplierBatchNo?: string;
  productionDate: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  temperatureZone: "FROZEN" | "CHILLED" | "NORMAL";
  storageConditions?: string;
  qualityReport?: string;
  inboundOrderNo?: string;
  operator: string;
  remark?: string;
}

export interface ExpiryAlert {
  batch: Batch;
  daysRemaining: number;
  alertLevel: "WARNING" | "DANGER" | "CRITICAL";
}
