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
  Site,
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
import { formatDate } from "@/utils/format";

const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === "true";

interface DashboardState {
  orders: Order[];
  riders: Rider[];
  exceptions: ExceptionRecord[];
  inventory: InventoryItem[];
  performanceStats: PerformanceStats[];
  operationLogs: OperationLog[];
  notifications: Notification[];
  routes: RouteRecord[];
  deliveryRoutes: RouteRecord[];
  discrepancies: DiscrepancyRecord[];
  sites: Site[];
  filters: FilterParams;
  isLoading: boolean;
  selectedOrder: Order | null;
  selectedException: ExceptionRecord | null;
  trackingPoints: Record<string, TrackingPoint[]>;
  temperatureRecords: Record<string, TemperatureRecord[]>;
  temperatureLogs: TemperatureRecord[];
  useSupabase: boolean;

  setFilters: (filters: Partial<FilterParams>) => void;
  setSelectedOrder: (order: Order | null) => void;
  setSelectedException: (exception: ExceptionRecord | null) => void;

  fetchOrders: () => Promise<void>;
  fetchRiders: () => Promise<void>;
  fetchExceptions: () => Promise<void>;
  fetchLogs: () => Promise<void>;
  fetchTrackingPoints: (orderId: string) => Promise<void>;
  fetchTemperatureRecords: (orderId: string) => Promise<void>;

  acceptOrder: (orderId: string) => Promise<void>;
  assignRider: (orderId: string, riderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<void>;
  updateExceptionStatus: (
    exceptionId: string,
    status: ExceptionRecord["status"]
  ) => Promise<void>;
  addExceptionNote: (
    exceptionId: string,
    content: string,
    operatorName: string
  ) => Promise<void>;
  markNotificationRead: (notificationId: string) => void;
  getFilteredOrders: () => Order[];
  getFilteredExceptions: () => ExceptionRecord[];
  getFilteredLogs: () => OperationLog[];
  getFilteredInventory: () => InventoryItem[];
  refreshData: () => Promise<void>;
  getTrackingPoints: (orderId: string) => TrackingPoint[];
  getTemperatureRecords: (orderId: string) => TemperatureRecord[];
  getDeliveryRoutes: (riderId: string) => RouteRecord[];
  exportLogs: (logs: OperationLog[]) => void;
  exportExceptions: (exceptions: ExceptionRecord[]) => void;
  exportOrders: (orders: Order[]) => void;
  exportInventory: (items: InventoryItem[]) => void;
  updateRiderLocation: (riderId: string, location: RiderLocation) => void;
  addOperationLog: (
    log: Omit<OperationLog, "id" | "timestamp" | "ipAddress" | "userId">
  ) => void;
  updateTemperatureLog: (orderId: string, log: Partial<TemperatureRecord>) => void;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
  if (!USE_SUPABASE) return null;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      console.warn(`API request failed: ${url} - ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data.success ? (data.data as T) : null;
  } catch (error) {
    console.warn(`API request error: ${url}`, error);
    return null;
  }
}

async function apiPost(url: string, body: any): Promise<boolean> {
  if (!USE_SUPABASE) return false;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) return false;

    const data = await res.json();
    return data.success === true;
  } catch (error) {
    console.warn(`API post error: ${url}`, error);
    return false;
  }
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
  deliveryRoutes: mockRoutes,
  discrepancies: mockDiscrepancies,
  sites: mockSites,
  filters: {},
  isLoading: false,
  selectedOrder: null,
  selectedException: null,
  trackingPoints: mockTrackingPoints,
  temperatureRecords: mockTemperatureRecords,
  temperatureLogs: Object.values(mockTemperatureRecords).flat(),
  useSupabase: USE_SUPABASE,

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  setSelectedOrder: (order) => {
    set({ selectedOrder: order });
  },

  setSelectedException: (exception) => {
    set({ selectedException: exception });
  },

  fetchOrders: async () => {
    set({ isLoading: true });

    const params = new URLSearchParams();
    const { filters } = get();
    if (filters.status) params.set("status", filters.status);
    if (filters.startTime) params.set("startTime", filters.startTime.toISOString());
    if (filters.endTime) params.set("endTime", filters.endTime.toISOString());
    if (filters.assignee) params.set("assignee", filters.assignee);

    const data = await apiFetch<Order[]>(`/api/orders?${params.toString()}`);

    if (data && data.length > 0) {
      set({ orders: data, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  fetchRiders: async () => {
    set({ isLoading: true });
    const data = await apiFetch<Rider[]>("/api/riders");

    if (data && data.length > 0) {
      set({ riders: data, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  fetchExceptions: async () => {
    set({ isLoading: true });

    const params = new URLSearchParams();
    const { filters } = get();
    if (filters.status) params.set("status", filters.status);
    if (filters.startTime) params.set("startTime", filters.startTime.toISOString());
    if (filters.endTime) params.set("endTime", filters.endTime.toISOString());
    if (filters.assignee) params.set("assignee", filters.assignee);

    const data = await apiFetch<ExceptionRecord[]>(
      `/api/exceptions?${params.toString()}`
    );

    if (data && data.length > 0) {
      set({ exceptions: data, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  fetchLogs: async () => {
    set({ isLoading: true });

    const params = new URLSearchParams();
    const { filters } = get();
    if (filters.startTime) params.set("startTime", filters.startTime.toISOString());
    if (filters.endTime) params.set("endTime", filters.endTime.toISOString());
    if (filters.assignee) params.set("assignee", filters.assignee);

    const data = await apiFetch<OperationLog[]>(`/api/logs?${params.toString()}`);

    if (data && data.length > 0) {
      set({ operationLogs: data, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  fetchTrackingPoints: async (orderId: string) => {
    const data = await apiFetch<TrackingPoint[]>(
      `/api/tracking?orderId=${orderId}`
    );

    if (data && data.length > 0) {
      set((state) => ({
        trackingPoints: { ...state.trackingPoints, [orderId]: data },
      }));
    }
  },

  fetchTemperatureRecords: async (orderId: string) => {
    const data = await apiFetch<TemperatureRecord[]>(
      `/api/temperature?orderId=${orderId}`
    );

    if (data && data.length > 0) {
      set((state) => ({
        temperatureRecords: { ...state.temperatureRecords, [orderId]: data },
      }));
    }
  },

  acceptOrder: async (orderId) => {
    set({ isLoading: true });

    const apiSuccess = await apiPost("/api/orders", {
      action: "accept",
      orderId,
    });

    if (!USE_SUPABASE || !apiSuccess) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === orderId
            ? { ...order, status: "accepted", updatedAt: new Date() }
            : order
        ),
        isLoading: false,
      }));
    } else {
      set({ isLoading: false });
      get().fetchOrders();
    }

    get().addOperationLog({
      operatorName: "调度主管",
      operatorRole: "dispatch",
      action: "接单",
      type: "order",
      targetId: orderId,
      details: "订单已接单，待分配骑手",
      orderNo: get().orders.find((o) => o.id === orderId)?.orderNo,
    });
  },

  assignRider: async (orderId, riderId) => {
    set({ isLoading: true });

    const rider = get().riders.find((r) => r.id === riderId);
    const order = get().orders.find((o) => o.id === orderId);

    const apiSuccess = await apiPost("/api/orders", {
      action: "assign",
      orderId,
      riderId,
      riderName: rider?.name,
    });

    if (!USE_SUPABASE || !apiSuccess) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: "assigned",
                riderId,
                riderName: rider?.name,
                updatedAt: new Date(),
              }
            : o
        ),
        riders: state.riders.map((r) =>
          r.id === riderId
            ? { ...r, status: "busy" as const, currentOrderId: orderId }
            : r
        ),
        isLoading: false,
      }));
    } else {
      set({ isLoading: false });
      get().fetchOrders();
      get().fetchRiders();
    }

    get().addOperationLog({
      operatorName: "调度主管",
      operatorRole: "dispatch",
      action: "分配骑手",
      type: "order",
      targetId: orderId,
      details: `分配骑手 ${rider?.name} 配送订单`,
      orderNo: order?.orderNo,
    });
  },

  updateOrderStatus: async (orderId, status) => {
    set({ isLoading: true });

    const order = get().orders.find((o) => o.id === orderId);

    const apiSuccess = await apiPost("/api/orders", {
      action: "updateStatus",
      orderId,
      status,
    });

    if (!USE_SUPABASE || !apiSuccess) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === orderId ? { ...o, status, updatedAt: new Date() } : o
        ),
        isLoading: false,
      }));
    } else {
      set({ isLoading: false });
      get().fetchOrders();
    }

    const statusLabels: Record<string, string> = {
      picked: "取件完成",
      delivering: "开始配送",
      completed: "配送完成",
      exception: "异常订单",
    };

    get().addOperationLog({
      operatorName: "系统",
      operatorRole: "system",
      action: statusLabels[status] || "状态更新",
      type: "order",
      targetId: orderId,
      details: `订单状态更新为 ${status}`,
      orderNo: order?.orderNo,
    });
  },

  updateExceptionStatus: async (exceptionId, status) => {
    set({ isLoading: true });

    const exception = get().exceptions.find((e) => e.id === exceptionId);

    const apiSuccess = await apiPost("/api/exceptions", {
      action: "updateStatus",
      exceptionId,
      status,
    });

    if (!USE_SUPABASE || !apiSuccess) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      set((state) => ({
        exceptions: state.exceptions.map((exc) =>
          exc.id === exceptionId
            ? {
                ...exc,
                status,
                processingEndTime:
                  status === "resolved" || status === "closed"
                    ? new Date()
                    : undefined,
                processingDuration:
                  status === "resolved" || status === "closed"
                    ? Math.floor(
                        (new Date().getTime() -
                          new Date(exc.processingStartTime).getTime()) /
                          60000
                      )
                    : undefined,
                updatedAt: new Date(),
              }
            : exc
        ),
        isLoading: false,
      }));
    } else {
      set({ isLoading: false });
      get().fetchExceptions();
    }

    const statusLabels: Record<string, string> = {
      processing: "开始处理",
      resolved: "已解决",
      closed: "已关闭",
    };

    get().addOperationLog({
      operatorName: "调度主管",
      operatorRole: "dispatch",
      action: statusLabels[status] || "状态更新",
      type: "exception",
      targetId: exceptionId,
      details: `异常状态更新为 ${status}`,
      orderNo: exception?.orderNo,
    });
  },

  addExceptionNote: async (exceptionId, content, operatorName) => {
    set({ isLoading: true });

    const apiSuccess = await apiPost("/api/exceptions", {
      action: "addNote",
      exceptionId,
      content,
      author: operatorName,
    });

    if (!USE_SUPABASE || !apiSuccess) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const newNote = {
        id: `note_${Date.now()}`,
        content,
        author: operatorName,
        operatorName,
        timestamp: new Date(),
      };

      set((state) => ({
        exceptions: state.exceptions.map((exc) =>
          exc.id === exceptionId
            ? {
                ...exc,
                processingNotes: [...(exc.processingNotes || []), newNote],
                updatedAt: new Date(),
              }
            : exc
        ),
        isLoading: false,
      }));
    } else {
      set({ isLoading: false });
      get().fetchExceptions();
    }
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
      filtered = filtered.filter(
        (o) => new Date(o.createdAt) >= new Date(filters.startTime!)
      );
    }

    if (filters.endTime) {
      filtered = filtered.filter(
        (o) => new Date(o.createdAt) <= new Date(filters.endTime!)
      );
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
      filtered = filtered.filter((e) =>
        e.assigneeName.includes(filters.assignee!)
      );
    }

    if (filters.startTime) {
      filtered = filtered.filter(
        (e) => new Date(e.createdAt) >= new Date(filters.startTime!)
      );
    }

    if (filters.endTime) {
      filtered = filtered.filter(
        (e) => new Date(e.createdAt) <= new Date(filters.endTime!)
      );
    }

    return filtered;
  },

  getFilteredLogs: () => {
    const { operationLogs, filters } = get();
    let filtered = [...operationLogs];

    if (filters.startTime) {
      filtered = filtered.filter(
        (l) => new Date(l.timestamp) >= new Date(filters.startTime!)
      );
    }

    if (filters.endTime) {
      filtered = filtered.filter(
        (l) => new Date(l.timestamp) <= new Date(filters.endTime!)
      );
    }

    if (filters.assignee) {
      filtered = filtered.filter((l) =>
        l.operatorName.includes(filters.assignee!)
      );
    }

    return filtered;
  },

  getFilteredInventory: () => {
    const { inventory, filters } = get();
    let filtered = [...inventory];

    if (filters.assignee) {
      filtered = filtered.filter((i) => i.siteName.includes(filters.assignee!));
    }

    return filtered;
  },

  refreshData: async () => {
    set({ isLoading: true });

    if (USE_SUPABASE) {
      await Promise.all([
        get().fetchOrders(),
        get().fetchRiders(),
        get().fetchExceptions(),
        get().fetchLogs(),
      ]);
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    set({ isLoading: false });
  },

  getTrackingPoints: (orderId) => {
    return get().trackingPoints[orderId] || [];
  },

  getTemperatureRecords: (orderId) => {
    return get().temperatureRecords[orderId] || [];
  },

  getDeliveryRoutes: (riderId) => {
    return get().deliveryRoutes.filter((r) => r.riderId === riderId);
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

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
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
        "优先级",
        "异常原因",
        "是否争议",
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
          exc.priority,
          `"${exc.reason.replace(/"/g, '""')}"`,
          exc.isDispute ? "是" : "否",
          exc.disputeReason
            ? `"${exc.disputeReason.replace(/"/g, '""')}"`
            : "",
          exc.compensationAmount || "",
          exc.status,
          exc.assigneeName,
          formatDate(exc.processingStartTime),
          exc.processingEndTime ? formatDate(exc.processingEndTime) : "",
          exc.processingDuration ? exc.processingDuration.toFixed(2) : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
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
        "收件人",
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
          order.recipient || "",
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

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `订单数据_${formatDate(new Date(), "yyyyMMdd_HHmmss")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  },

  exportInventory: (items) => {
    const csvContent = [
      [
        "SKU",
        "商品名称",
        "站点",
        "库存数量",
        "预留数量",
        "可用数量",
        "在途数量",
        "在途来源",
        "预计到达",
        "单位成本",
        "预警阈值",
        "最后更新",
      ].join(","),
      ...items.map((item) =>
        [
          item.sku,
          item.productName,
          item.siteName,
          item.quantity,
          item.reservedQuantity,
          item.availableQuantity,
          item.inTransitQuantity || "",
          item.inTransitFrom || "",
          item.inTransitEstimatedArrival
            ? formatDate(item.inTransitEstimatedArrival)
            : "",
          item.unitCost || "",
          item.warningThreshold,
          formatDate(item.lastUpdated),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `库存数据_${formatDate(new Date(), "yyyyMMdd_HHmmss")}.csv`;
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

  addOperationLog: (log) => {
    const newLog: OperationLog = {
      id: `log_${Date.now()}`,
      userId: "user_001",
      ...log,
      ipAddress: "192.168.1.1",
      timestamp: new Date(),
    };

    if (USE_SUPABASE) {
      apiPost("/api/logs", {
        user_id: "user_001",
        ...log,
        ip_address: "192.168.1.1",
      }).catch(() => {});
    }

    set((state) => ({
      operationLogs: [newLog, ...state.operationLogs],
    }));
  },

  updateTemperatureLog: (orderId, log) => {
    set((state) => {
      const existing = state.temperatureRecords[orderId] || [];
      const updated = [...existing, log as TemperatureRecord];
      return {
        temperatureRecords: { ...state.temperatureRecords, [orderId]: updated },
        temperatureLogs: [...state.temperatureLogs, log as TemperatureRecord],
      };
    });
  },
}));
