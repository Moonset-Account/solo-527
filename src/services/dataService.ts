import { WorkOrder, Supplier, FilterOptions, MetricsSummary, Building } from "@/types";
import { MOCK_WORK_ORDERS, MOCK_SUPPLIERS, MOCK_BUILDINGS } from "@/mock/data";
import { calculateResponseTime, isWorkHoliday, formatDuration } from "@/lib/utils";
import dayjs from "dayjs";

// 供应商维度缓存（模拟 Redis 缓存）
const supplierCache = new Map<string, {
  data: Supplier & MetricsSummary;
  timestamp: number;
}>();

const CACHE_TTL = 60 * 60 * 1000; // 1小时

// 工单生命周期清洗服务
export function cleanWorkOrderLifecycle(orders: WorkOrder[]): WorkOrder[] {
  return orders.map((order) => {
    const cleaned = { ...order };

    cleaned.responseTime = calculateResponseTime(order.createdAt, order.respondedAt);
    cleaned.isHoliday = isWorkHoliday(order.createdAt);

    if (order.parentOrderId) {
      cleaned.isRepeat = true;
    }

    return cleaned;
  });
}

// 获取清洗后的工单数据
export function getCleanedWorkOrders(): WorkOrder[] {
  return cleanWorkOrderLifecycle(MOCK_WORK_ORDERS);
}

// 按筛选条件过滤工单（支持多维度下钻）
export function filterWorkOrders(
  orders: WorkOrder[],
  filters: FilterOptions
): WorkOrder[] {
  return orders.filter((order) => {
    if (filters.buildingId && order.buildingId !== filters.buildingId) return false;
    if (filters.roomType && order.roomType !== filters.roomType) return false;
    if (filters.repairType && order.repairType !== filters.repairType) return false;
    if (filters.supplierId && order.supplierId !== filters.supplierId) return false;
    if (filters.status && order.status !== filters.status) return false;
    if (filters.isRepeat !== undefined && order.isRepeat !== filters.isRepeat) return false;
    if (filters.isHoliday !== undefined && order.isHoliday !== filters.isHoliday) return false;

    if (filters.month) {
      const orderMonth = dayjs(order.createdAt).format("YYYY-MM");
      if (orderMonth !== filters.month) return false;
    }

    return true;
  });
}

// 供应商维度聚合（带缓存）
export function getSupplierMetrics(supplierId: string): (Supplier & MetricsSummary) | null {
  const cached = supplierCache.get(supplierId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const supplier = MOCK_SUPPLIERS.find((s) => s.id === supplierId);
  if (!supplier) return null;

  const orders = getCleanedWorkOrders().filter((o) => o.supplierId === supplierId);
  const metrics = calculateMetrics(orders);

  const result = { ...supplier, ...metrics };

  supplierCache.set(supplierId, {
    data: result,
    timestamp: Date.now(),
  });

  return result;
}

// 获取所有供应商指标（带缓存）
export function getAllSupplierMetrics(): (Supplier & MetricsSummary)[] {
  return MOCK_SUPPLIERS.map((s) => {
    const cached = getSupplierMetrics(s.id);
    return cached || (s as Supplier & MetricsSummary);
  });
}

// 计算指标汇总
export function calculateMetrics(orders: WorkOrder[]): MetricsSummary {
  const validOrders = orders.filter(
    (o) => o.status === "completed" || o.status === "closed"
  );

  const nonHolidayOrders = validOrders.filter((o) => !o.isHoliday);

  const totalOrders = orders.length;
  const repeatCount = orders.filter((o) => o.isRepeat).length;
  const repeatRate = totalOrders > 0 ? (repeatCount / totalOrders) * 100 : 0;

  const responseTimes = nonHolidayOrders
    .filter((o) => o.responseTime)
    .map((o) => o.responseTime!);
  const avgResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

  const timeoutThreshold = 120;
  const timeoutCount = nonHolidayOrders.filter(
    (o) => o.responseTime && o.responseTime > timeoutThreshold
  ).length;
  const timeoutRate =
    nonHolidayOrders.length > 0
      ? (timeoutCount / nonHolidayOrders.length) * 100
      : 0;

  const ratings = validOrders
    .filter((o) => o.tenantRating)
    .map((o) => o.tenantRating!);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

  const holidayOrders = orders.filter((o) => o.isHoliday).length;

  return {
    totalOrders,
    repeatRate: Math.round(repeatRate * 10) / 10,
    avgResponseTime: Math.round(avgResponseTime),
    timeoutRate: Math.round(timeoutRate * 10) / 10,
    avgRating: Math.round(avgRating * 10) / 10,
    holidayOrders,
  };
}

// PostGIS 点位聚合模拟（按楼栋聚合）
export function aggregateBuildingPoints(orders: WorkOrder[]): (Building & {
  orderCount: number;
  repeatCount: number;
  timeoutCount: number;
  repeatRate: number;
})[] {
  const buildingMap = new Map<string, {
    count: number;
    repeat: number;
    timeout: number;
  }>();

  orders.forEach((order) => {
    const current = buildingMap.get(order.buildingId) || { count: 0, repeat: 0, timeout: 0 };
    current.count++;
    if (order.isRepeat) current.repeat++;
    if (order.responseTime && order.responseTime > 120 && !order.isHoliday) current.timeout++;
    buildingMap.set(order.buildingId, current);
  });

  return MOCK_BUILDINGS.map((building) => {
    const stats = buildingMap.get(building.id) || { count: 0, repeat: 0, timeout: 0 };
    return {
      ...building,
      orderCount: stats.count,
      repeatCount: stats.repeat,
      timeoutCount: stats.timeout,
      repeatRate: stats.count > 0 ? Math.round((stats.repeat / stats.count) * 1000) / 10 : 0,
    };
  });
}

// 复修工单关联查询
export function getRepeatWorkOrders(orders: WorkOrder[]): WorkOrder[] {
  return orders.filter((o) => o.isRepeat);
}

// 获取工单的复修历史
export function getRepeatHistory(orderId: string): WorkOrder[] {
  const order = MOCK_WORK_ORDERS.find((o) => o.id === orderId);
  if (!order) return [];

  const history: WorkOrder[] = [];
  let currentId = order.parentOrderId;

  while (currentId) {
    const parent = MOCK_WORK_ORDERS.find((o) => o.id === currentId);
    if (parent) {
      history.unshift(parent);
      currentId = parent.parentOrderId;
    } else {
      break;
    }
  }

  return history;
}

// 获取超时工单（排除节假日和确认中）
export function getTimeoutOrders(orders: WorkOrder[], threshold: number = 120): WorkOrder[] {
  return orders
    .filter((o) => {
      if (o.isHoliday) return false;
      if (o.status === "confirmed" || o.status === "pending") return false;
      return o.responseTime && o.responseTime > threshold;
    })
    .sort((a, b) => (b.responseTime || 0) - (a.responseTime || 0));
}

// 获取低分评价工单
export function getLowRatingOrders(orders: WorkOrder[], maxRating: number = 2): WorkOrder[] {
  return orders
    .filter((o) => o.tenantRating && o.tenantRating <= maxRating)
    .sort((a, b) => (a.tenantRating || 0) - (b.tenantRating || 0));
}

// 导出货单数据格式化
export function formatOrdersForExport(orders: WorkOrder[]): Record<string, any>[] {
  return orders.map((o) => ({
    工单编号: o.orderNo,
    楼栋: o.buildingName,
    房间: o.roomNo,
    房型: o.roomType,
    维修类型: o.repairType,
    供应商: o.supplierName,
    状态: o.status,
    创建时间: dayjs(o.createdAt).format("YYYY-MM-DD HH:mm"),
    响应时间: o.respondedAt ? dayjs(o.respondedAt).format("YYYY-MM-DD HH:mm") : "-",
    响应时长: o.responseTime ? formatDuration(o.responseTime) : "-",
    完成时间: o.completedAt ? dayjs(o.completedAt).format("YYYY-MM-DD HH:mm") : "-",
    是否复修: o.isRepeat ? "是" : "否",
    关联原工单: o.parentOrderNo || "-",
    是否节假日: o.isHoliday ? "是" : "否",
    租户评分: o.tenantRating || "-",
    租户评价: o.tenantFeedback || "-",
    材料费用: o.materials.reduce((sum, m) => sum + m.quantity * m.price, 0),
    申诉中: o.appealRecords.length > 0 ? "是" : "否",
  }));
}

// 预缓存所有供应商数据
export function preloadSupplierCache() {
  MOCK_SUPPLIERS.forEach((s) => {
    getSupplierMetrics(s.id);
  });
  console.log("供应商维度缓存已预热完成");
}
