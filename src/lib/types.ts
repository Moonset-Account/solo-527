export enum UserRole {
  INTERNAL = "INTERNAL",
  EXTERNAL = "EXTERNAL",
}

export enum MachineryType {
  HARVESTER = "HARVESTER",
  SEEDER = "SEEDER",
  PLOW = "PLOW",
  TRANSPLANTER = "TRANSPLANTER",
  SPRAYER = "SPRAYER",
}

export enum MachineryStatus {
  IDLE = "IDLE",
  WORKING = "WORKING",
  MAINTENANCE = "MAINTENANCE",
  DISPATCHED = "DISPATCHED",
}

export enum ReservationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  DISPATCHED = "DISPATCHED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  RESCHEDULED = "RESCHEDULED",
}

export enum DispatchStatus {
  PENDING = "PENDING",
  IN_TRANSIT = "IN_TRANSIT",
  ARRIVED = "ARRIVED",
  COMPLETED = "COMPLETED",
}

export enum MaintenanceStatus {
  REPORTED = "REPORTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum SettlementStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface ReservationFilter {
  status?: ReservationStatus;
  village?: string;
  operationType?: MachineryType;
  startDate?: string;
  endDate?: string;
  machineryId?: number;
  userId?: number;
  search?: string;
}

export interface CreateReservationInput {
  fieldId: number;
  operationType: MachineryType;
  scheduledDate: string;
  area: number;
  pricePerMu: number;
  village: string;
  contactName: string;
  contactPhone: string;
  contractId?: number;
  remarks?: string;
}

export interface CreateDispatchInput {
  reservationId: number;
  machineryId: number;
  driverId: number;
  route?: string;
  remarks?: string;
}

export interface CreateFuelRecordInput {
  dispatchId?: number;
  machineryId: number;
  fuelAmount: number;
  fuelPrice: number;
  fillDate: string;
  odometer?: number;
  remarks?: string;
}

export interface CreateMaintenanceInput {
  machineryId: number;
  title: string;
  description: string;
  reportedDate: string;
  cost?: number;
  parts?: string;
  remarks?: string;
}

export interface BatchRescheduleInput {
  date: string;
  village?: string;
  newDate: string;
  reason: string;
}

export const MACHINERY_TYPE_LABELS: Record<MachineryType, string> = {
  [MachineryType.HARVESTER]: "收割机",
  [MachineryType.SEEDER]: "播种机",
  [MachineryType.PLOW]: "耕地机",
  [MachineryType.TRANSPLANTER]: "插秧机",
  [MachineryType.SPRAYER]: "喷药机",
};

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  [ReservationStatus.PENDING]: "待审批",
  [ReservationStatus.APPROVED]: "已审批",
  [ReservationStatus.REJECTED]: "已拒绝",
  [ReservationStatus.DISPATCHED]: "已派发",
  [ReservationStatus.IN_PROGRESS]: "作业中",
  [ReservationStatus.COMPLETED]: "已完成",
  [ReservationStatus.CANCELLED]: "已取消",
  [ReservationStatus.RESCHEDULED]: "已改期",
};

export const DISPATCH_STATUS_LABELS: Record<DispatchStatus, string> = {
  [DispatchStatus.PENDING]: "待出发",
  [DispatchStatus.IN_TRANSIT]: "运输中",
  [DispatchStatus.ARRIVED]: "已到达",
  [DispatchStatus.COMPLETED]: "已完成",
};

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  [MaintenanceStatus.REPORTED]: "已上报",
  [MaintenanceStatus.IN_PROGRESS]: "维修中",
  [MaintenanceStatus.COMPLETED]: "已完成",
  [MaintenanceStatus.CANCELLED]: "已取消",
};

export const SETTLEMENT_STATUS_LABELS: Record<SettlementStatus, string> = {
  [SettlementStatus.PENDING]: "待结算",
  [SettlementStatus.PAID]: "已结算",
  [SettlementStatus.CANCELLED]: "已取消",
};

export const RESERVATION_STATUS_COLORS: Record<ReservationStatus, string> = {
  [ReservationStatus.PENDING]: "bg-yellow-100 text-yellow-800",
  [ReservationStatus.APPROVED]: "bg-blue-100 text-blue-800",
  [ReservationStatus.REJECTED]: "bg-red-100 text-red-800",
  [ReservationStatus.DISPATCHED]: "bg-purple-100 text-purple-800",
  [ReservationStatus.IN_PROGRESS]: "bg-orange-100 text-orange-800",
  [ReservationStatus.COMPLETED]: "bg-green-100 text-green-800",
  [ReservationStatus.CANCELLED]: "bg-gray-100 text-gray-800",
  [ReservationStatus.RESCHEDULED]: "bg-cyan-100 text-cyan-800",
};
