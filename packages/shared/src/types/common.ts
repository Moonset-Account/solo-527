export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export type OperationType =
  | "INBOUND"
  | "OUTBOUND"
  | "TRANSFER"
  | "ADJUST"
  | "COUNT"
  | "SCRAP";

export type AuditStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

export type TemperatureZone = "FROZEN" | "CHILLED" | "NORMAL";
