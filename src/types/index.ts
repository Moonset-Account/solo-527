export type OrderStatus =
  | "pending"
  | "assigned"
  | "picked"
  | "delivering"
  | "completed"
  | "exception";

export type OrderPriority = "normal" | "urgent" | "vip";

export type RiderStatus = "idle" | "busy" | "offline" | "delivering";

export type ExceptionType =
  | "timeout"
  | "temperature"
  | "discrepancy"
  | "damage"
  | "other";

export type ExceptionStatus = "pending" | "processing" | "resolved" | "closed";

export interface Order {
  id: string;
  orderNo: string;
  status: OrderStatus;
  priority: OrderPriority;
  pickupAddress: string;
  deliveryAddress: string;
  pickupLat: number;
  pickupLng: number;
  deliveryLat: number;
  deliveryLng: number;
  estimatedDeliveryTime: Date;
  actualDeliveryTime?: Date;
  riderId?: string;
  riderName?: string;
  goodsType: string;
  temperatureRequired?: { min: number; max: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface RiderLocation {
  lat: number;
  lng: number;
  speed: number;
  timestamp: Date;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  status: RiderStatus;
  currentLat?: number;
  currentLng?: number;
  currentLocation?: RiderLocation;
  currentOrderId?: string;
  batteryLevel?: number;
  rating: number;
  totalDeliveries: number;
}

export interface TrackingPoint {
  id: string;
  orderId: string;
  riderId: string;
  lat: number;
  lng: number;
  speed: number;
  timestamp: Date;
}

export interface TemperatureRecord {
  id: string;
  orderId: string;
  temperature: number;
  humidity: number;
  timestamp: Date;
  isNormal: boolean;
}

export interface ExceptionRecord {
  id: string;
  orderId: string;
  orderNo: string;
  type: ExceptionType;
  reason: string;
  disputeReason?: string;
  compensationAmount?: number;
  status: ExceptionStatus;
  assigneeId: string;
  assigneeName: string;
  processingStartTime: Date;
  processingEndTime?: Date;
  processingDuration?: number;
  createdAt: Date;
}

export interface Site {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface InventoryItem {
  id: string;
  siteId: string;
  siteName: string;
  sku: string;
  productName: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  warningThreshold: number;
  lastUpdated: Date;
}

export type OperationLogType =
  | "order"
  | "rider"
  | "tracking"
  | "exception"
  | "warning"
  | "error"
  | "config"
  | "export"
  | "compensation"
  | "notification";

export interface OperationLog {
  id: string;
  userId: string;
  operatorName: string;
  operatorRole: string;
  action: string;
  type: OperationLogType;
  targetId: string;
  details: string;
  orderNo?: string;
  ipAddress: string;
  timestamp: Date;
}

export interface PerformanceStats {
  date: string;
  totalOrders: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  onTimeRate: number;
  avgDeliveryTime: number;
}

export interface FilterParams {
  startTime?: Date;
  endTime?: Date;
  status?: string;
  assignee?: string;
}

export interface RouteRecord {
  id: string;
  riderId: string;
  riderName: string;
  orderId: string;
  orderNo: string;
  distance: number;
  duration: number;
  startTime: Date;
  endTime: Date;
  points: TrackingPoint[];
}

export interface DiscrepancyRecord {
  id: string;
  orderId: string;
  orderNo: string;
  expectedItems: number;
  actualItems: number;
  difference: number;
  reason: string;
  reportedBy: string;
  reportedAt: Date;
  status: "pending" | "investigating" | "resolved";
}

export interface Notification {
  id: string;
  type: "timeout" | "temperature" | "discrepancy" | "info";
  title: string;
  message: string;
  orderId?: string;
  read: boolean;
  createdAt: Date;
}
