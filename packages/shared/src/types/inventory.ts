import type { OperationType } from "./common";

export type InventoryStatus = "NORMAL" | "LOCKED" | "RESERVED" | "DAMAGED";

export interface Inventory {
  _id: string;
  batchId: string;
  batchNo: string;
  sku: string;
  skuName: string;
  locationId: string;
  locationCode: string;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  unit: string;
  status: InventoryStatus;
  temperatureZone: "FROZEN" | "CHILLED" | "NORMAL";
  expiryDate: Date;
  lastCountDate?: Date;
  accuracyRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryTransaction {
  _id: string;
  transactionNo: string;
  batchId: string;
  batchNo: string;
  sku: string;
  skuName: string;
  operationType: OperationType;
  fromLocationId?: string;
  fromLocationCode?: string;
  toLocationId?: string;
  toLocationCode?: string;
  quantity: number;
  unit: string;
  referenceNo?: string;
  operator: string;
  operationTime: Date;
  remark?: string;
}

export interface ScanInboundInput {
  batchNo: string;
  sku: string;
  locationCode: string;
  quantity: number;
  operator: string;
  remark?: string;
}

export interface ScanOutboundInput {
  batchNo: string;
  sku: string;
  locationCode: string;
  quantity: number;
  operator: string;
  outboundOrderNo?: string;
  remark?: string;
}
