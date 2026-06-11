import { create } from "zustand";
import type {
  Order,
  Rider,
  RiderLocation,
  ExceptionRecord,
  InventoryItem,
  PerformanceStats,
  OperationLog,
  Notification,
  FilterParams,
  TrackingPoint,
  TemperatureRecord,
  RouteRecord,
  DiscrepancyRecord,
} from "@/types";
import {
  mockOrders,
  mockRiders,
  mockExceptions,
  mockInventory,
  mockPerformanceStats,
  mockOperationLogs,
  mockNotifications,
  mockTrackingPoints,
  mockTemperatureRecords,
  mockRoutes,
  mockDiscrepancies,
  mockSites,
} from "@/data/mockData";
import type { Site, OperationLog, ExceptionRecord, Order } from "@/types";
import { formatDate } from "@/utils/format";

interface DashboardState {
  orders: Order[];
  riders: Rider[];
  exceptions: ExceptionRecord[];
  inventory: InventoryItem[];
  performanceStats: PerformanceStats[];
  operationLogs: OperationLog[];
  notifications: Notification[];
  routes: RouteRecord[];
  discrepancies: DiscrepancyRecord[];
  sites: Site[];
  filters: FilterParams;
  isLoading: boolean;
  selectedOrder: Order | null;
  trackingPoints: Record<string, TrackingPoint[]>;
  temperatureRecords: Record<string, TemperatureRecord[]>;

  setFilters: (filters: Partial<FilterParams>) => void;
  setSelectedOrder: (order: Order | null) => void;
  assignRider: (orderId: string, riderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<void>;
  updateExceptionStatus: (exceptionId: string, status: ExceptionRecord["status"]) => Promise<void>;
  markNotificationRead: (notificationId: string) => void;
  getFilteredOrders: () => Order[];
  getFilteredExceptions: () => ExceptionRecord[];
  refreshData: () => Promise<void>;
  getTrackingPoints: (orderId: string) => TrackingPoint[];
  getTemperatureRecords: (orderId: string) => TemperatureRecord[];
  exportLogs: (logs: OperationLog[]) => void;
  exportExceptions: (exceptions: ExceptionRecord[]) => void;
  exportOrders: (orders: Order[]) => void;
  updateRiderLocation: (riderId: string, location: RiderLocation) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  orders: mockOrders,
  riders: mockRiders,
  exceptions: mockExceptions,
  inventory: mockInventory,
  performanceStats: mockPerformanceStats,
  operationLogs: mockOperationLogs,
  notifications: mockNotifications,
  routes: mockRoutes,
  discrepancies: mockDiscrepancies,
  sites: mockSites,
  filters: {},
  isLoading: false,
  selectedOrder: null,
  trackingPoints: mockTrackingPoints,
  temperatureRecords: mockTemperatureRecords,

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  setSelectedOrder: (order) => {
    set({ selectedOrder: order });
  },

  assignRider: async (orderId, riderId) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));

    const rider = get().riders.find((r) => r.id === riderId);

    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "assigned",
              riderId,
              riderName: rider?.name,
              updatedAt: new Date(),
            }
          : order
      ),
      riders: state.riders.map((r) =>
        r.id === riderId ? { ...r, status: "busy", currentOrderId: orderId } : r
      ),
      isLoading: false,
    }));
  },

  updateOrderStatus: async (orderId, status) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));

    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId ? { ...order, status, updatedAt: new Date() } : order
      ),
      isLoading: false,
    }));
  },

  updateExceptionStatus: async (exceptionId, status) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));

    set((state) => ({
      exceptions: state.exceptions.map((exc) =>
        exc.id === exceptionId
          ? {
              ...exc,
              status,
              processingEndTime: status === "resolved" || status === "closed" ? new Date() : undefined,
            }
          : exc
      ),
      isLoading: false,
    }));
  },

  markNotificationRead: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
    }));
  },

  getFilteredOrders: () => {
    const { orders, filters } = get();
    let filtered = [...orders];

    if (filters.status) {
      filtered = filtered.filter((o) => o.status === filters.status);
    }

    if (filters.startTime) {
      filtered = filtered.filter((o) => o.createdAt >= filters.startTime!);
    }

    if (filters.endTime) {
      filtered = filtered.filter((o) => o.createdAt <= filters.endTime!);
    }

    if (filters.assignee) {
      filtered = filtered.filter((o) => o.riderName?.includes(filters.assignee!));
    }

    return filtered;
  },

  getFilteredExceptions: () => {
    const { exceptions, filters } = get();
    let filtered = [...exceptions];

    if (filters.status) {
      filtered = filtered.filter((e) => e.status === filters.status);
    }

    if (filters.assignee) {
      filtered = filtered.filter((e) => e.assigneeName.includes(filters.assignee!));
    }

    if (filters.startTime) {
      filtered = filtered.filter((e) => e.createdAt >= filters.startTime!);
    }

    if (filters.endTime) {
      filtered = filtered.filter((e) => e.createdAt <= filters.endTime!);
    }

    return filtered;
  },

  refreshData: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    set({ isLoading: false });
  },

  getTrackingPoints: (orderId) => {
    return get().trackingPoints[orderId] || [];
  },

  getTemperatureRecords: (orderId) => {
    return get().temperatureRecords[orderId] || [];
  },

  exportLogs: (logs) => {
    const csvContent = [
      ["时间", "类型", "操作", "订单号", "操作员", "角色", "详情", "IP地址"].join(","),
      ...logs.map((log) =>
        [
          formatDate(log.timestamp),
          log.type,
          log.action,
          log.orderNo || "",
          log.operatorName,
          log.operatorRole,
          `"${log.details.replace(/"/g, '""')}"`,
          log.ipAddress,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `操作日志_${formatDate(new Date(), "yyyyMMdd_HHmmss")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  },

  exportExceptions: (exceptions) => {
    const csvContent = [
      [
        "异常编号",
        "订单号",
        "异常类型",
        "异常原因",
        "争议原因",
        "赔付金额",
        "状态",
        "负责人",
        "处理开始时间",
        "处理结束时间",
        "处理耗时(分钟)",
      ].join(","),
      ...exceptions.map((exc) =>
        [
          exc.id,
          exc.orderNo,
          exc.type,
          `"${exc.reason.replace(/"/g, '""')}"`,
          exc.disputeReason ? `"${exc.disputeReason.replace(/"/g, '""')}"` : "",
          exc.compensationAmount || "",
          exc.status,
          exc.assigneeName,
          formatDate(exc.processingStartTime),
          exc.processingEndTime ? formatDate(exc.processingEndTime) : "",
          exc.processingDuration ? (exc.processingDuration / 60).toFixed(2) : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `异常记录_${formatDate(new Date(), "yyyyMMdd_HHmmss")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  },

  exportOrders: (orders) => {
    const csvContent = [
      [
        "订单号",
        "状态",
        "优先级",
        "取货地址",
        "送货地址",
        "预计送达时间",
        "实际送达时间",
        "骑手",
        "商品类型",
        "创建时间",
      ].join(","),
      ...orders.map((order) =>
        [
          order.orderNo,
          order.status,
          order.priority,
          `"${order.pickupAddress.replace(/"/g, '""')}"`,
          `"${order.deliveryAddress.replace(/"/g, '""')}"`,
          formatDate(order.estimatedDeliveryTime),
          order.actualDeliveryTime ? formatDate(order.actualDeliveryTime) : "",
          order.riderName || "",
          order.goodsType,
          formatDate(order.createdAt),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `订单数据_${formatDate(new Date(), "yyyyMMdd_HHmmss")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  },

  updateRiderLocation: (riderId, location) => {
    set((state) => ({
      riders: state.riders.map((rider) =>
        rider.id === riderId
          ? {
              ...rider,
              currentLocation: location,
              currentLat: location.lat,
              currentLng: location.lng,
            }
          : rider
      ),
    }));
  },
}));
