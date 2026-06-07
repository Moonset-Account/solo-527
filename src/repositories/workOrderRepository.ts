import { WorkOrder, Supplier, Building, MetricsSummary, FilterOptions } from "@/types";
import { queryDatabase, isUsingMockData } from "@/lib/db";
import { MOCK_WORK_ORDERS, MOCK_SUPPLIERS, MOCK_BUILDINGS, generateWorkOrders } from "@/mock/data";
import { cleanWorkOrderLifecycle, calculateMetrics, filterWorkOrders } from "@/services/dataService";
import dayjs from "dayjs";

let cachedWorkOrders: WorkOrder[] | null = null;

function getMockWorkOrders(): WorkOrder[] {
  if (!cachedWorkOrders) {
    cachedWorkOrders = cleanWorkOrderLifecycle(MOCK_WORK_ORDERS);
  }
  return cachedWorkOrders;
}

export async function getWorkOrders(filters?: FilterOptions): Promise<WorkOrder[]> {
  if (isUsingMockData()) {
    const orders = getMockWorkOrders();
    return filters ? filterWorkOrders(orders, filters) : orders;
  }

  let sql = `
    SELECT 
      w.id, w.order_no as "orderNo", w.building_id as "buildingId", w.building_name as "buildingName",
      w.room_no as "roomNo", w.room_type as "roomType", w.repair_type as "repairType",
      w.supplier_id as "supplierId", w.supplier_name as "supplierName", w.status,
      w.created_at as "createdAt", w.responded_at as "respondedAt",
      w.completed_at as "completedAt", w.response_time as "responseTime",
      w.is_repeat as "isRepeat", w.parent_order_id as "parentOrderId",
      w.parent_order_no as "parentOrderNo", w.is_holiday as "isHoliday",
      w.tenant_rating as "tenantRating", w.tenant_feedback as "tenantFeedback",
      w.tenant_name as "tenantName", w.lng, w.lat
    FROM work_orders_cleaned w
    WHERE 1=1
  `;

  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.buildingId) {
    sql += ` AND w.building_id = $${paramIndex++}`;
    params.push(filters.buildingId);
  }
  if (filters?.roomType) {
    sql += ` AND w.room_type = $${paramIndex++}`;
    params.push(filters.roomType);
  }
  if (filters?.repairType) {
    sql += ` AND w.repair_type = $${paramIndex++}`;
    params.push(filters.repairType);
  }
  if (filters?.supplierId) {
    sql += ` AND w.supplier_id = $${paramIndex++}`;
    params.push(filters.supplierId);
  }
  if (filters?.status) {
    sql += ` AND w.status = $${paramIndex++}`;
    params.push(filters.status);
  }
  if (filters?.isRepeat !== undefined) {
    sql += ` AND w.is_repeat = $${paramIndex++}`;
    params.push(filters.isRepeat);
  }
  if (filters?.isHoliday !== undefined) {
    sql += ` AND w.is_holiday = $${paramIndex++}`;
    params.push(filters.isHoliday);
  }
  if (filters?.month) {
    sql += ` AND DATE_TRUNC('month', w.created_at) = DATE_TRUNC('month', $${paramIndex++}::DATE)`;
    params.push(filters.month + "-01");
  }

  sql += ` ORDER BY w.created_at DESC`;

  const rows = await queryDatabase<any>(sql, params);
  return rows.map((row) => ({
    id: row.id,
    orderNo: row.orderNo,
    buildingId: row.buildingId,
    buildingName: row.buildingName,
    roomNo: row.roomNo,
    roomType: row.roomType,
    repairType: row.repairType,
    supplierId: row.supplierId,
    supplierName: row.supplierName,
    status: row.status,
    createdAt: new Date(row.createdAt),
    respondedAt: row.respondedAt ? new Date(row.respondedAt) : undefined,
    completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
    responseTime: row.responseTime,
    isRepeat: row.isRepeat,
    parentOrderId: row.parentOrderId,
    parentOrderNo: row.parentOrderNo,
    isHoliday: row.isHoliday,
    tenantRating: row.tenantRating,
    tenantFeedback: row.tenantFeedback,
    tenantName: row.tenantName,
    materials: [],
    photos: [],
    appealRecords: [],
    location: row.lng && row.lat ? { lng: row.lng, lat: row.lat } : undefined,
  }));
}

export async function getSuppliers(): Promise<Supplier[]> {
  if (isUsingMockData()) {
    return MOCK_SUPPLIERS;
  }

  const sql = `
    SELECT id, name, contact, phone
    FROM suppliers
    ORDER BY name
  `;
  return queryDatabase<Supplier>(sql);
}

export async function getBuildings(): Promise<Building[]> {
  if (isUsingMockData()) {
    return MOCK_BUILDINGS;
  }

  const sql = `
    SELECT id, name, address, lng, lat
    FROM buildings
    ORDER BY name
  `;
  return queryDatabase<Building>(sql);
}

export async function getBuildingMetrics(): Promise<(Building & {
  orderCount: number;
  repeatCount: number;
  timeoutCount: number;
  repeatRate: number;
  geomGeojson?: string;
})[]> {
  if (isUsingMockData()) {
    const { aggregateBuildingPoints } = await import("@/services/dataService");
    return aggregateBuildingPoints(getMockWorkOrders());
  }

  const sql = `
    SELECT 
      id,
      name,
      address,
      lng, lat,
      geom_geojson as "geomGeojson",
      order_count as "orderCount",
      repeat_count as "repeatCount",
      timeout_count as "timeoutCount",
      repeat_rate as "repeatRate"
    FROM v_building_metrics
    ORDER BY name
  `;
  return queryDatabase(sql);
}

export async function getSupplierMetrics(supplierId: string): Promise<(Supplier & MetricsSummary) | null> {
  if (isUsingMockData()) {
    const { getSupplierMetrics: getMockSupplierMetrics } = await import("@/services/dataService");
    return getMockSupplierMetrics(supplierId);
  }

  const sql = `
    SELECT 
      s.id, s.name, s.contact, s.phone,
      c.total_orders as "totalOrders",
      c.repeat_rate as "repeatRate",
      c.avg_response_time as "avgResponseTime",
      c.timeout_rate as "timeoutRate",
      c.avg_rating as "avgRating",
      c.holiday_orders as "holidayOrders"
    FROM suppliers s
    LEFT JOIN supplier_metrics_cache c ON s.id = c.supplier_id
      AND c.cached_at > NOW() - (c.ttl_seconds || 3600) * INTERVAL '1 second'
    WHERE s.id = $1
  `;
  const rows = await queryDatabase(sql, [supplierId]);
  return rows[0] || null;
}

export async function getAllSupplierMetrics(): Promise<(Supplier & MetricsSummary)[]> {
  if (isUsingMockData()) {
    const { getAllSupplierMetrics: getMockAllSupplierMetrics } = await import("@/services/dataService");
    return getMockAllSupplierMetrics();
  }

  const sql = `
    SELECT 
      s.id, s.name, s.contact, s.phone,
      COALESCE(c.total_orders, 0) as "totalOrders",
      COALESCE(c.repeat_rate, 0) as "repeatRate",
      COALESCE(c.avg_response_time, 0) as "avgResponseTime",
      COALESCE(c.timeout_rate, 0) as "timeoutRate",
      COALESCE(c.avg_rating, 0) as "avgRating",
      COALESCE(c.holiday_orders, 0) as "holidayOrders"
    FROM suppliers s
    LEFT JOIN supplier_metrics_cache c ON s.id = c.supplier_id
      AND c.cached_at > NOW() - (c.ttl_seconds || 3600) * INTERVAL '1 second'
    ORDER BY c.repeat_rate DESC
  `;
  return queryDatabase(sql);
}

export async function getMetricsSummary(filters?: FilterOptions): Promise<MetricsSummary> {
  if (isUsingMockData()) {
    const orders = getMockWorkOrders();
    const filtered = filters ? filterWorkOrders(orders, filters) : orders;
    return calculateMetrics(filtered);
  }

  const orders = await getWorkOrders(filters);
  return calculateMetrics(orders);
}

export async function refreshSupplierCache(): Promise<void> {
  if (isUsingMockData()) {
    const { preloadSupplierCache } = await import("@/services/dataService");
    preloadSupplierCache();
    return;
  }

  await queryDatabase("SELECT refresh_supplier_metrics_cache()");
  console.log("✓ 供应商维度缓存已刷新");
}

export async function runCleaningPipeline(): Promise<void> {
  if (isUsingMockData()) {
    cachedWorkOrders = cleanWorkOrderLifecycle(generateWorkOrders(150));
    console.log("✓ Mock 数据清洗完成");
    return;
  }

  await queryDatabase("SELECT clean_work_order_lifecycle()");
  await refreshSupplierCache();
  console.log("✓ 数据清洗管道执行完成");
}
