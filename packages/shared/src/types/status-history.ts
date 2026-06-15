export interface StatusHistory {
  _id: string;
  entityId: string;
  entityType:
    | "BATCH"
    | "INVENTORY"
    | "TRANSFER"
    | "RECEIPT_DIFF"
    | "SAFETY_STOCK"
    | "LOCATION";
  fromStatus: string;
  toStatus: string;
  reason: string;
  operator: string;
  operationTime: Date;
  extraData?: Record<string, unknown>;
}

export interface CreateStatusHistoryInput {
  entityId: string;
  entityType: StatusHistory["entityType"];
  fromStatus: string;
  toStatus: string;
  reason: string;
  operator: string;
  extraData?: Record<string, unknown>;
}
