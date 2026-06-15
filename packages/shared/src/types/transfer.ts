import type { AuditStatus } from "./common";

export type TransferType = "ALLOCATION" | "PURCHASE" | "RETURN" | "EMERGENCY";

export interface Transfer {
  _id: string;
  transferNo: string;
  type: TransferType;
  sku: string;
  skuName: string;
  batchNo?: string;
  quantity: number;
  unit: string;
  fromLocation: string;
  toLocation: string;
  supplier?: string;
  plannedDate: Date;
  expectedDate: Date;
  actualDate?: Date;
  status: AuditStatus | "DELAYED";
  delayReason?: string;
  delayReasonCategory?: string;
  applicant: string;
  approver?: string;
  approvedAt?: Date;
  handler?: string;
  handlingStartTime?: Date;
  handlingEndTime?: Date;
  remark?: string;
  relatedSafetyStockId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransferCreateInput {
  type: TransferType;
  sku: string;
  skuName: string;
  batchNo?: string;
  quantity: number;
  unit: string;
  fromLocation: string;
  toLocation: string;
  supplier?: string;
  plannedDate: string;
  expectedDate: string;
  applicant: string;
  remark?: string;
  relatedSafetyStockId?: string;
}
