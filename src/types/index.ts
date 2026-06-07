export type WorkOrderStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "appealing"
  | "closed";

export interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface AppealRecord {
  id: string;
  workOrderId: string;
  reason: string;
  photos: string[];
  tenantConfirmation?: boolean;
  createdAt: Date;
  status: "pending" | "approved" | "rejected";
}

export interface WorkOrder {
  id: string;
  orderNo: string;
  buildingId: string;
  buildingName: string;
  roomNo: string;
  roomType: string;
  repairType: string;
  supplierId: string;
  supplierName: string;
  status: WorkOrderStatus;
  createdAt: Date;
  respondedAt?: Date;
  completedAt?: Date;
  responseTime?: number;
  isRepeat: boolean;
  parentOrderId?: string;
  parentOrderNo?: string;
  isHoliday: boolean;
  tenantRating?: number;
  tenantFeedback?: string;
  tenantName: string;
  materials: MaterialItem[];
  photos: string[];
  appealRecords: AppealRecord[];
  location: {
    lng: number;
    lat: number;
  };
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  totalOrders: number;
  repeatRate: number;
  avgResponseTime: number;
  timeoutCount: number;
  avgRating: number;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  lng: number;
  lat: number;
  totalOrders: number;
  repeatCount: number;
  timeoutCount: number;
}

export interface MetricsSummary {
  totalOrders: number;
  repeatRate: number;
  avgResponseTime: number;
  timeoutRate: number;
  avgRating: number;
  holidayOrders: number;
}

export interface FilterOptions {
  buildingId?: string;
  roomType?: string;
  repairType?: string;
  supplierId?: string;
  month?: string;
  status?: WorkOrderStatus;
  isRepeat?: boolean;
  isHoliday?: boolean;
}

export const ROOM_TYPES = ["一居室", "两居室", "三居室", "四居室", "LOFT"];

export const REPAIR_TYPES = [
  "水电维修",
  "空调维修",
  "家具维修",
  "门锁维修",
  "墙面维修",
  "卫浴维修",
  "厨房维修",
  "其他",
];

export const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  pending: "待处理",
  confirmed: "已确认",
  in_progress: "处理中",
  completed: "已完成",
  appealing: "申诉中",
  closed: "已关闭",
};

export const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  pending: "bg-slate-100 text-slate-600",
  confirmed: "bg-blue-100 text-blue-600",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  appealing: "bg-orange-100 text-orange-700",
  closed: "bg-slate-100 text-slate-500",
};
