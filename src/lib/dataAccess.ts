import type {
  Prescription,
  KPIData,
  WaitDistributionItem,
  WindowCompareItem,
  HourlyPrescriptionItem,
  SankeyData,
  FilterState,
} from '@/types';
import { mockPrescriptions, calculateKPIData, calculateWaitDistribution, calculateWindowCompare, calculateHourlyPrescriptions, calculateSankeyData, windows as mockWindows } from '@/data/mockData';
import { isDatabaseAvailable, queryDb } from '@/lib/db';
import { applyFilters, parseWaitTimeRange, getWindowIdByNo } from '@/utils/filters';
import type { DrillDownFilter } from '@/store/useFilterStore';

export interface AnalyticsOverview {
  kpi: KPIData;
  waitDistribution: WaitDistributionItem[];
  windowCompare: WindowCompareItem[];
  hourlyPrescriptions: HourlyPrescriptionItem[];
  sankeyData: SankeyData;
  totalCount: number;
}

export interface WindowHeatmapItem {
  windowId: string;
  windowNo: string;
  windowName: string;
  count: number;
  avgWaitTime: number;
  utilization: number;
  status: 'normal' | 'warning' | 'critical';
  coordinates: [number, number];
  location: { type: string; coordinates: [number, number] };
}

const WINDOW_COORDS: Record<string, [number, number]> = {
  w1: [116.3968, 39.9072],
  w2: [116.3969, 39.9072],
  w3: [116.3970, 39.9072],
  w4: [116.3971, 39.9072],
  w5: [116.39695, 39.9070],
  w6: [116.39705, 39.9070],
};

function buildWhereClause(filters: FilterState, drillDown: DrillDownFilter): { clause: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.dateRange.start && filters.dateRange.end) {
    conditions.push(`p.created_at_date BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
    params.push(filters.dateRange.start, filters.dateRange.end);
    paramIndex += 2;
  }

  if (filters.windows.length > 0) {
    conditions.push(`p.window_id = ANY($${paramIndex}::uuid[])`);
    params.push(filters.windows);
    paramIndex++;
  }

  if (filters.pharmacists.length > 0) {
    conditions.push(`p.pharmacist_id = ANY($${paramIndex}::uuid[])`);
    params.push(filters.pharmacists);
    paramIndex++;
  }

  if (filters.departments.length > 0) {
    conditions.push(`p.department_id = ANY($${paramIndex}::uuid[])`);
    params.push(filters.departments);
    paramIndex++;
  }

  if (filters.prescriptionTypes.length > 0) {
    conditions.push(`p.type = ANY($${paramIndex}::varchar[])`);
    params.push(filters.prescriptionTypes);
    paramIndex++;
  }

  if (filters.timePeriods.length > 0) {
    conditions.push(`p.time_period = ANY($${paramIndex}::varchar[])`);
    params.push(filters.timePeriods);
    paramIndex++;
  }

  if (drillDown.waitTimeRange) {
    const { min, max } = parseWaitTimeRange(drillDown.waitTimeRange);
    conditions.push(`p.wait_time_minutes >= $${paramIndex} AND p.wait_time_minutes < $${paramIndex + 1}`);
    params.push(min, max);
    paramIndex += 2;
  }

  if (drillDown.windowNo) {
    const windowId = getWindowIdByNo(drillDown.windowNo);
    if (windowId) {
      conditions.push(`p.window_id = $${paramIndex}`);
      params.push(windowId);
      paramIndex++;
    }
  }

  if (drillDown.hour) {
    const match = drillDown.hour.match(/(\d+):00/);
    if (match) {
      conditions.push(`p.hour = $${paramIndex}`);
      params.push(parseInt(match[1]));
      paramIndex++;
    }
  }

  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

async function fetchFromDb<T>(
  mockFallback: T,
  queryFn: () => Promise<T>
): Promise<{ data: T; source: 'db' | 'mock' }> {
  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const data = await queryFn();
      return { data, source: 'db' };
    } catch (e) {
      console.error('DB query failed, using mock fallback:', e);
      return { data: mockFallback, source: 'mock' };
    }
  }
  return { data: mockFallback, source: 'mock' };
}

export async function getAnalyticsOverview(
  filters: FilterState,
  drillDown: DrillDownFilter = {}
): Promise<{ data: AnalyticsOverview; source: 'db' | 'mock' }> {
  const filteredMock = applyFilters(mockPrescriptions, filters, drillDown);

  const mockData: AnalyticsOverview = {
    kpi: calculateKPIData(filteredMock),
    waitDistribution: calculateWaitDistribution(filteredMock),
    windowCompare: calculateWindowCompare(filteredMock),
    hourlyPrescriptions: calculateHourlyPrescriptions(filteredMock),
    sankeyData: calculateSankeyData(filteredMock),
    totalCount: filteredMock.length,
  };

  return fetchFromDb(mockData, async () => {
    const { clause, params } = buildWhereClause(filters, drillDown);

    const kpiQuery = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN type = 'emergency' THEN 1 END) as emergency_count,
        COUNT(CASE WHEN type = 'normal' THEN 1 END) as normal_count,
        COUNT(CASE WHEN type = 'specialist' THEN 1 END) as specialist_count,
        ROUND(AVG(wait_time_minutes)::numeric, 1) as avg_wait,
        ROUND(AVG(CASE WHEN type = 'emergency' THEN wait_time_minutes END)::numeric, 1) as avg_wait_emergency,
        ROUND(AVG(CASE WHEN type = 'normal' THEN wait_time_minutes END)::numeric, 1) as avg_wait_normal,
        ROUND(AVG(CASE WHEN type = 'specialist' THEN wait_time_minutes END)::numeric, 1) as avg_wait_specialist,
        ROUND(AVG(dispense_time_minutes)::numeric, 1) as avg_dispense,
        ROUND(COUNT(CASE WHEN refunded_at IS NOT NULL THEN 1 END)::numeric / COUNT(*), 4) as refund_rate
      FROM prescriptions p
      ${clause}
    `;

    const kpiRes = await queryDb(kpiQuery, params);
    const kpiRow = kpiRes.rows[0];

    const kpi: KPIData = {
      totalPrescriptions: parseInt(kpiRow.total),
      emergencyPrescriptions: parseInt(kpiRow.emergency_count || 0),
      normalPrescriptions: parseInt(kpiRow.normal_count || 0),
      specialistPrescriptions: parseInt(kpiRow.specialist_count || 0),
      avgWaitTime: parseFloat(kpiRow.avg_wait || 0),
      avgWaitTimeEmergency: parseFloat(kpiRow.avg_wait_emergency || 0),
      avgWaitTimeNormal: parseFloat(kpiRow.avg_wait_normal || 0),
      avgWaitTimeSpecialist: parseFloat(kpiRow.avg_wait_specialist || 0),
      avgDispenseTime: parseFloat(kpiRow.avg_dispense || 0),
      refundRate: parseFloat(kpiRow.refund_rate || 0),
      windowUtilization: {},
      peakHour: 9,
    };

    const windowCompareQuery = `
      SELECT
        w.window_no,
        COUNT(p.id) as total,
        ROUND(AVG(p.wait_time_minutes)::numeric, 1) as avg_wait,
        ROUND(AVG(p.dispense_time_minutes)::numeric, 1) as avg_dispense,
        ROUND(COUNT(p.id)::numeric / (w.capacity * 30) * 100, 1) as utilization
      FROM windows w
      LEFT JOIN prescriptions p ON p.window_id = w.id ${clause ? 'AND ' + clause.replace('WHERE ', '') : ''}
      WHERE w.is_active = true
      GROUP BY w.id, w.window_no, w.capacity
      ORDER BY w.window_no
    `;

    const windowRes = await queryDb(windowCompareQuery, params);
    const windowCompare: WindowCompareItem[] = windowRes.rows.map((r: any) => ({
      windowNo: r.window_no,
      totalPrescriptions: parseInt(r.total || 0),
      avgWaitTime: parseFloat(r.avg_wait || 0),
      avgDispenseTime: parseFloat(r.avg_dispense || 0),
      utilization: parseFloat(r.utilization || 0),
    }));

    kpi.windowUtilization = Object.fromEntries(
      windowCompare.map((w) => [w.windowNo, w.utilization])
    );

    const waitDistribution: WaitDistributionItem[] = await Promise.all(
      [
        { min: 0, max: 10, label: '0-10分钟' },
        { min: 10, max: 20, label: '10-20分钟' },
        { min: 20, max: 30, label: '20-30分钟' },
        { min: 30, max: 45, label: '30-45分钟' },
        { min: 45, max: 60, label: '45-60分钟' },
        { min: 60, max: 99999, label: '60分钟以上' },
      ].map(async (range) => {
        const distQuery = `
          SELECT
            COUNT(*) as total,
            COUNT(CASE WHEN type = 'emergency' THEN 1 END) as emergency
          FROM prescriptions p
          ${clause ? clause + ' AND' : 'WHERE'} wait_time_minutes >= $${params.length + 1} AND wait_time_minutes < $${params.length + 2}
        `;
        const res = await queryDb(distQuery, [...params, range.min, range.max]);
        const row = res.rows[0];
        const total = parseInt(row.total || 0);
        const emergency = parseInt(row.emergency || 0);
        return {
          range: range.label,
          count: total,
          emergencyCount: emergency,
          normalCount: total - emergency,
        };
      })
    );

    const hourlyQuery = `
      SELECT
        hour,
        COUNT(CASE WHEN type = 'emergency' THEN 1 END) as emergency,
        COUNT(CASE WHEN type = 'normal' THEN 1 END) as normal,
        COUNT(CASE WHEN type = 'specialist' THEN 1 END) as specialist
      FROM prescriptions p
      ${clause}
      GROUP BY hour
      ORDER BY hour
    `;

    const hourlyRes = await queryDb(hourlyQuery, params);
    const hourlyMap: Record<number, { emergency: number; normal: number; specialist: number }> = {};
    hourlyRes.rows.forEach((r: any) => {
      hourlyMap[r.hour] = {
        emergency: parseInt(r.emergency || 0),
        normal: parseInt(r.normal || 0),
        specialist: parseInt(r.specialist || 0),
      };
    });

    const hourlyPrescriptions: HourlyPrescriptionItem[] = Array.from({ length: 17 }, (_, i) => i + 6).map((h) => ({
      hour: `${h}:00`,
      emergency: hourlyMap[h]?.emergency || 0,
      normal: hourlyMap[h]?.normal || 0,
      specialist: hourlyMap[h]?.specialist || 0,
    }));

    const sankeyData = mockData.sankeyData;

    return {
      kpi,
      waitDistribution,
      windowCompare,
      hourlyPrescriptions,
      sankeyData,
      totalCount: kpi.totalPrescriptions,
    };
  });
}

export async function getWindowHeatmap(
  filters: FilterState,
  drillDown: DrillDownFilter = {}
): Promise<{ data: WindowHeatmapItem[]; source: 'db' | 'mock' }> {
  const filteredMock = applyFilters(mockPrescriptions, filters, drillDown);
  const mockHeatmap: WindowHeatmapItem[] = mockWindows.map((w) => {
    const windowPrescriptions = filteredMock.filter((p) => p.windowId === w.id);
    const count = windowPrescriptions.length;
    const avgWaitTime = count > 0
      ? Math.round((windowPrescriptions.reduce((s, p) => s + p.waitTime, 0) / count) * 10) / 10
      : 0;
    const utilization = Math.min(100, Math.round((count / (w.capacity * 30)) * 100 * 10) / 10);
    return {
      windowId: w.id,
      windowNo: w.windowNo,
      windowName: w.windowName,
      count,
      avgWaitTime,
      utilization,
      status: utilization > 80 ? 'critical' : utilization > 50 ? 'warning' : 'normal',
      coordinates: WINDOW_COORDS[w.id] || [116.397, 39.907],
      location: {
        type: 'Point',
        coordinates: WINDOW_COORDS[w.id] || [116.397, 39.907],
      },
    };
  });

  return fetchFromDb(mockHeatmap, async () => {
    const { clause, params } = buildWhereClause(filters, drillDown);

    const query = `
      SELECT
        w.id as window_id,
        w.window_no,
        w.window_name,
        COUNT(p.id) as count,
        ROUND(AVG(p.wait_time_minutes)::numeric, 1) as avg_wait_time,
        ROUND(COUNT(p.id)::numeric / (w.capacity * 30) * 100, 1) as utilization,
        ST_X(w.location::geometry) as lng,
        ST_Y(w.location::geometry) as lat
      FROM windows w
      LEFT JOIN prescriptions p ON p.window_id = w.id ${clause ? 'AND ' + clause.replace('WHERE ', '') : ''}
      WHERE w.is_active = true
      GROUP BY w.id, w.window_no, w.window_name, w.capacity, w.location
      ORDER BY w.window_no
    `;

    const res = await queryDb(query, params);

    return res.rows.map((r: any) => {
      const utilization = parseFloat(r.utilization || 0);
      return {
        windowId: r.window_id,
        windowNo: r.window_no,
        windowName: r.window_name,
        count: parseInt(r.count || 0),
        avgWaitTime: parseFloat(r.avg_wait_time || 0),
        utilization,
        status: utilization > 80 ? 'critical' : utilization > 50 ? 'warning' : 'normal',
        coordinates: [parseFloat(r.lng), parseFloat(r.lat)] as [number, number],
        location: {
          type: 'Point',
          coordinates: [parseFloat(r.lng), parseFloat(r.lat)] as [number, number],
        },
      };
    });
  });
}

export async function getPrescriptionDetails(
  filters: FilterState,
  drillDown: DrillDownFilter = {},
  page: number = 1,
  pageSize: number = 50,
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{
  data: { records: Prescription[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } };
  source: 'db' | 'mock';
}> {
  const filteredMock = applyFilters(mockPrescriptions, filters, drillDown);
  const sortedMock = [...filteredMock].sort((a: any, b: any) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });
  const total = sortedMock.length;
  const start = (page - 1) * pageSize;
  const paginatedMock = sortedMock.slice(start, start + pageSize);

  return fetchFromDb(
    { records: paginatedMock, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } },
    async () => {
      const { clause, params } = buildWhereClause(filters, drillDown);

      const countQuery = `SELECT COUNT(*) as total FROM prescriptions p ${clause}`;
      const countRes = await queryDb(countQuery, params);
      const total = parseInt(countRes.rows[0].total);

      const orderMap: Record<string, string> = {
        prescriptionNo: 'prescription_no',
        type: 'type',
        departmentName: 'dept_name',
        windowNo: 'window_no',
        pharmacistName: 'pharmacist_name',
        waitTime: 'wait_time_minutes',
        dispenseTime: 'dispense_time_minutes',
        createdAt: 'created_at',
      };

      const orderColumn = orderMap[sortBy] || 'created_at';

      const dataQuery = `
        SELECT
          p.id,
          p.prescription_no as "prescriptionNo",
          p.type,
          p.department_id as "departmentId",
          d.dept_name as "departmentName",
          p.window_id as "windowId",
          w.window_no as "windowNo",
          p.pharmacist_id as "pharmacistId",
          ph.name as "pharmacistName",
          p.created_at as "createdAt",
          p.paid_at as "paidAt",
          p.dispensed_at as "dispensedAt",
          p.called_at as "calledAt",
          p.picked_at as "pickedAt",
          p.refunded_at as "refundedAt",
          p.amount,
          p.drug_count as "drugCount",
          p.patient_category as "patientCategory",
          p.wait_time_minutes as "waitTime",
          p.dispense_time_minutes as "dispenseTime",
          p.time_period as "timePeriod",
          p.hour
        FROM prescriptions p
        JOIN departments d ON p.department_id = d.id
        JOIN windows w ON p.window_id = w.id
        LEFT JOIN pharmacists ph ON p.pharmacist_id = ph.id
        ${clause}
        ORDER BY ${orderColumn} ${sortOrder.toUpperCase()}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      const dataRes = await queryDb(dataQuery, [...params, pageSize, (page - 1) * pageSize]);

      return {
        records: dataRes.rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }
  );
}
