import type { AuditStatus } from "./common";

export type DiffType = "QUANTITY" | "QUALITY" | "DOCUMENT" | "OTHER";

export interface ReceiptDiff {
  _id: string;
  diffNo: string;
  inboundOrderNo: string;
  batchNo: string;
  sku: string;
  skuName: string;
  diffType: DiffType;
  expectedQuantity: number;
  actualQuantity: number;
  diffQuantity: number;
  unit: string;
  description: string;
  rootCause?: string;
  correctiveAction?: string;
  status: AuditStatus;
  reporter: string;
  handler?: string;
  handledAt?: Date;
  approver?: string;
  approvedAt?: Date;
  relatedSafetyStockId?: string;
  impactOnSafetyStock?: boolean;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReceiptDiffCreateInput {
  inboundOrderNo: string;
  batchNo: string;
  sku: string;
  skuName: string;
  diffType: DiffType;
  expectedQuantity: number;
  actualQuantity: number;
  description: string;
  reporter: string;
  rootCause?: string;
  relatedSafetyStockId?: string;
  remark?: string;
}
