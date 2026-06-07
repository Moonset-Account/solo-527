import type {
  Prescription,
  KPIData,
  WaitDistributionItem,
  WindowCompareItem,
  HourlyPrescriptionItem,
  SankeyData,
  FilterState,
  PharmacistCompareItem,
  DepartmentCompareItem,
} from '@/types';
import { isDatabaseAvailable, queryDb } from '@/lib/db';
import { parseWaitTimeRange, getWindowIdByNo } from '@/utils/filters';
import type { DrillDownFilter } from '@/store/useFilterStore';
import type { WindowHeatmapData } from '@/components/map/PharmacyHeatmap';

export interface AnalyticsOverview {
  kpi: KPIData;
  waitDistribution: WaitDistributionItem[];
  windowCompare: WindowCompareItem[];
  hourlyPrescriptions: HourlyPrescriptionItem[];
  sankeyData: SankeyData;
  pharmacistCompare: PharmacistCompareItem[];
  departmentCompare: DepartmentCompareItem[];
  totalCount: number;
}

const WINDOW_COORDS: Record<string, [number, number]> = {
  w1: [116.3968, 39.9072],
  w2: [116.3969, 39.9072],
  w3: [116.3970, 39.9072],
  w4: [116.3971, 39.9072],
  w5: [116.39695, 39.9070],
  w6: [116.39705, 39.9070],
};

function buildWhereClause(filters: FilterState, drillDown: DrillDownFilter, tableAlias: string = 'p'): { clause: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;
  const t = tableAlias ? `${tableAlias}.` : '';

  if (filters.dateRange.start && filters.dateRange.end) {
    conditions.push(`${t}created_at_date BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
    params.push(filters.dateRange.start, filters.dateRange.end);
    paramIndex += 2;
  }

  if (filters.windows.length > 0) {
    conditions.push(`${t}window_id = ANY($${paramIndex}::uuid[])`);
    params.push(filters.windows);
    paramIndex++;
  }

  if (filters.pharmacists.length > 0) {
    conditions.push(`${t}pharmacist_id = ANY($${paramIndex}::uuid[])`);
    params.push(filters.pharmacists);
    paramIndex++;
  }

  if (filters.departments.length > 0) {
    conditions.push(`${t}department_id = ANY($${paramIndex}::uuid[])`);
    params.push(filters.departments);
    paramIndex++;
  }

  if (filters.prescriptionTypes.length > 0) {
    conditions.push(`${t}type = ANY($${paramIndex}::varchar[])`);
    params.push(filters.prescriptionTypes);
    paramIndex++;
  }

  if (filters.timePeriods.length > 0) {
    conditions.push(`${t}time_period = ANY($${paramIndex}::varchar[])`);
    params.push(filters.timePeriods);
    paramIndex++;
  }

  if (drillDown.waitTimeRange) {
    const { min, max } = parseWaitTimeRange(drillDown.waitTimeRange);
    if (max === Infinity) {
      conditions.push(`${t}wait_time_minutes >= $${paramIndex}`);
      params.push(min);
      paramIndex++;
    } else {
      conditions.push(`${t}wait_time_minutes >= $${paramIndex} AND ${t}wait_time_minutes < $${paramIndex + 1}`);
      params.push(min, max);
      paramIndex += 2;
    }
  }

  if (drillDown.windowNo) {
    conditions.push(`w.window_no = $${paramIndex}`);
    params.push(drillDown.windowNo);
    paramIndex++;
  }

  if (drillDown.hour) {
    const match = drillDown.hour.match(/(\d+):00/);
    if (match) {
      conditions.push(`${t}hour = $${paramIndex}`);
      params.push(parseInt(match[1]));
      paramIndex++;
    }
  }

  if (drillDown.processNode) {
    const nodeMap: Record<string, string> = {
      '处方创建': 'created_at',
      '已缴费': 'paid_at',
      '配药完成': 'dispensed_at',
      '已叫号': 'called_at',
      '已取药': 'picked_at',
      '已退药': 'refunded_at',
    };
    const col = nodeMap[drillDown.processNode];
    if (col) {
      conditions.push(`${t}${col} IS NOT NULL`);
      if (col === 'refunded_at') {
        conditions.push(`${t}status = 'refunded'`);
      }
    }
  }

  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

export async function getAnalyticsOverview(
  filters: FilterState,
  drillDown: DrillDownFilter = {}
): Promise<{ data: AnalyticsOverview; source: string }> {
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    throw new Error(
      'PostgreSQL 数据库未连接。请配置 DATABASE_URL 并运行 sql/setup_with_data.sql 初始化数据。'
    );
  }

  const { clause, params } = buildWhereClause(filters, drillDown);

  const kpiQuery = `
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN p.type = 'emergency' THEN 1 END) as emergency_count,
      COUNT(CASE WHEN p.type = 'normal' THEN 1 END) as normal_count,
      COUNT(CASE WHEN p.type = 'specialist' THEN 1 END) as specialist_count,
      ROUND(AVG(p.wait_time_minutes)::numeric, 1) as avg_wait,
      ROUND(AVG(CASE WHEN p.type = 'emergency' THEN p.wait_time_minutes END)::numeric, 1) as avg_wait_emergency,
      ROUND(AVG(CASE WHEN p.type = 'normal' THEN p.wait_time_minutes END)::numeric, 1) as avg_wait_normal,
      ROUND(AVG(CASE WHEN p.type = 'specialist' THEN p.wait_time_minutes END)::numeric, 1) as avg_wait_specialist,
      ROUND(AVG(p.dispense_time_minutes)::numeric, 1) as avg_dispense,
      ROUND(COUNT(CASE WHEN p.refunded_at IS NOT NULL THEN 1 END)::numeric / NULLIF(COUNT(*), 0), 4) as refund_rate
    FROM prescriptions p
    JOIN windows w ON p.window_id = w.id
    ${clause}
  `;

  const kpiRes = await queryDb(kpiQuery, params);
  const kpiRow = kpiRes.rows[0];

  const kpi: KPIData = {
    totalPrescriptions: parseInt(kpiRow.total || 0),
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

  const windowWhere = clause
    ? clause.replace(/p\./g, 'p.').replace(/w\./g, 'w.')
    : '';

  const windowCompareQuery = `
    SELECT
      w.window_no,
      COUNT(p.id) as total,
      ROUND(AVG(p.wait_time_minutes)::numeric, 1) as avg_wait,
      ROUND(AVG(p.dispense_time_minutes)::numeric, 1) as avg_dispense,
      ROUND(COUNT(p.id)::numeric / NULLIF(w.capacity, 0) / 30 * 100, 1) as utilization
    FROM windows w
    LEFT JOIN prescriptions p ON p.window_id = w.id
      ${windowWhere ? 'AND ' + windowWhere.replace('WHERE ', '') : ''}
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
    utilization: Math.min(100, parseFloat(r.utilization || 0)),
  }));

  kpi.windowUtilization = Object.fromEntries(
    windowCompare.map((w) => [w.windowNo, w.utilization])
  );

  const waitRanges = [
    { min: 0, max: 10, label: '0-10分钟' },
    { min: 10, max: 20, label: '10-20分钟' },
    { min: 20, max: 30, label: '20-30分钟' },
    { min: 30, max: 45, label: '30-45分钟' },
    { min: 45, max: 60, label: '45-60分钟' },
    { min: 60, max: 99999, label: '60分钟以上' },
  ];

  const waitDistribution: WaitDistributionItem[] = [];
  for (const range of waitRanges) {
    const distQuery = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN p.type = 'emergency' THEN 1 END) as emergency
      FROM prescriptions p
      JOIN windows w ON p.window_id = w.id
      ${clause ? clause + ' AND' : 'WHERE'} p.wait_time_minutes >= $${params.length + 1} AND p.wait_time_minutes < $${params.length + 2}
    `;
    const res = await queryDb(distQuery, [...params, range.min, range.max]);
    const row = res.rows[0];
    const total = parseInt(row.total || 0);
    const emergency = parseInt(row.emergency || 0);
    waitDistribution.push({
      range: range.label,
      count: total,
      emergencyCount: emergency,
      normalCount: total - emergency,
    });
  }

  const hourlyQuery = `
    SELECT
      p.hour,
      COUNT(CASE WHEN p.type = 'emergency' THEN 1 END) as emergency,
      COUNT(CASE WHEN p.type = 'normal' THEN 1 END) as normal,
      COUNT(CASE WHEN p.type = 'specialist' THEN 1 END) as specialist
    FROM prescriptions p
    JOIN windows w ON p.window_id = w.id
    ${clause}
    GROUP BY p.hour
    ORDER BY p.hour
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

  const pharmacistQuery = `
    SELECT
      ph.id as pharmacist_id,
      ph.name as pharmacist_name,
      ph.title,
      COUNT(p.id) as total,
      ROUND(AVG(p.wait_time_minutes)::numeric, 1) as avg_wait,
      ROUND(AVG(p.dispense_time_minutes)::numeric, 1) as avg_dispense,
      ROUND(COUNT(CASE WHEN p.type = 'emergency' THEN 1 END)::numeric / NULLIF(COUNT(*), 0), 4) as emergency_rate
    FROM pharmacists ph
    LEFT JOIN prescriptions p ON p.pharmacist_id = ph.id ${clause ? 'AND ' + clause.replace('WHERE ', '').replace('w.', 'p.') : ''}
    WHERE ph.is_active = true
    GROUP BY ph.id, ph.name, ph.title
    ORDER BY total DESC
  `;

  const pharmRes = await queryDb(pharmacistQuery, params);
  const pharmacistCompare: PharmacistCompareItem[] = pharmRes.rows.map((r: any) => ({
    pharmacistId: r.pharmacist_id,
    pharmacistName: r.pharmacist_name,
    title: r.title || '药师',
    totalPrescriptions: parseInt(r.total || 0),
    avgWaitTime: parseFloat(r.avg_wait || 0),
    avgDispenseTime: parseFloat(r.avg_dispense || 0),
    emergencyRate: parseFloat(r.emergency_rate || 0),
  }));

  const departmentQuery = `
    SELECT
      d.id as department_id,
      d.dept_name as department_name,
      d.dept_type as dept_category,
      COUNT(p.id) as total,
      ROUND(AVG(p.wait_time_minutes)::numeric, 1) as avg_wait,
      ROUND(COUNT(CASE WHEN p.type = 'emergency' THEN 1 END)::numeric / NULLIF(COUNT(*), 0), 4) as emergency_rate,
      ROUND(AVG(p.amount)::numeric, 2) as avg_amount
    FROM departments d
    LEFT JOIN prescriptions p ON p.department_id = d.id ${clause ? 'AND ' + clause.replace('WHERE ', '').replace('w.', 'p.') : ''}
    WHERE d.is_active = true
    GROUP BY d.id, d.dept_name, d.dept_type
    ORDER BY total DESC
  `;

  const deptRes = await queryDb(departmentQuery, params);
  const departmentCompare: DepartmentCompareItem[] = deptRes.rows.map((r: any) => ({
    departmentId: r.department_id,
    departmentName: r.department_name,
    deptCategory: r.dept_category || 'clinical',
    totalPrescriptions: parseInt(r.total || 0),
    avgWaitTime: parseFloat(r.avg_wait || 0),
    emergencyRate: parseFloat(r.emergency_rate || 0),
    avgAmount: parseFloat(r.avg_amount || 0),
  }));

  const durationQuery = `
    SELECT
      ROUND(AVG(EXTRACT(EPOCH FROM (p.paid_at - p.created_at)) / 60)::numeric, 1) as pay_duration,
      ROUND(AVG(EXTRACT(EPOCH FROM (p.dispensed_at - p.paid_at)) / 60)::numeric, 1) as dispense_duration,
      ROUND(AVG(EXTRACT(EPOCH FROM (p.called_at - p.dispensed_at)) / 60)::numeric, 1) as call_duration,
      ROUND(AVG(EXTRACT(EPOCH FROM (p.picked_at - p.called_at)) / 60)::numeric, 1) as pick_duration,
      ROUND(AVG(EXTRACT(EPOCH FROM (p.refunded_at - p.called_at)) / 60)::numeric, 1) as refund_duration,
      COUNT(CASE WHEN p.refunded_at IS NOT NULL THEN 1 END) as refund_count
    FROM prescriptions p
    JOIN windows w ON p.window_id = w.id
    ${clause}
  `;

  const durationRes = await queryDb(durationQuery, params);
  const durRow = durationRes.rows[0];

  const total = kpi.totalPrescriptions;
  const refundCount = parseInt(durRow.refund_count || Math.round(total * kpi.refundRate));
  const pickCount = total - refundCount;

  const sankeyNodes = ['处方创建', '已缴费', '配药完成', '已叫号', '已取药', '已退药'];
  const sankeyData: SankeyData = {
    nodes: sankeyNodes.map((name) => ({ name })),
    links: [
      { source: 0, target: 1, value: total, avgDuration: parseFloat(durRow.pay_duration || 7.2) },
      { source: 1, target: 2, value: total, avgDuration: parseFloat(durRow.dispense_duration || kpi.avgDispenseTime) },
      { source: 2, target: 3, value: total, avgDuration: parseFloat(durRow.call_duration || 2.5) },
      { source: 3, target: 4, value: pickCount, avgDuration: parseFloat(durRow.pick_duration || 8.5) },
      { source: 3, target: 5, value: refundCount, avgDuration: parseFloat(durRow.refund_duration || 15.0) },
    ],
  };

  return {
    data: {
      kpi,
      waitDistribution,
      windowCompare,
      hourlyPrescriptions,
      sankeyData,
      pharmacistCompare,
      departmentCompare,
      totalCount: kpi.totalPrescriptions,
    },
    source: 'PostgreSQL + PostGIS',
  };
}

export async function getWindowHeatmap(
  filters: FilterState,
  drillDown: DrillDownFilter = {}
): Promise<{ data: WindowHeatmapData[]; source: string }> {
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    throw new Error('PostgreSQL 数据库未连接，无法获取热力图数据。');
  }

  const { clause, params } = buildWhereClause(filters, drillDown);

  const query = `
    SELECT
      w.id as window_id,
      w.window_no,
      w.window_name,
      COUNT(p.id) as count,
      ROUND(AVG(p.wait_time_minutes)::numeric, 1) as avg_wait_time,
      ROUND(COUNT(p.id)::numeric / NULLIF(w.capacity, 0) / 30 * 100, 1) as utilization,
      ST_X(w.location::geometry) as lng,
      ST_Y(w.location::geometry) as lat
    FROM windows w
    LEFT JOIN prescriptions p ON p.window_id = w.id
      ${clause ? 'AND ' + clause.replace('WHERE ', '') : ''}
    WHERE w.is_active = true
    GROUP BY w.id, w.window_no, w.window_name, w.capacity, w.location
    ORDER BY w.window_no
  `;

  const res = await queryDb(query, params);

  const data: WindowHeatmapData[] = res.rows.map((r: any) => {
    const utilization = Math.min(100, parseFloat(r.utilization || 0));
    const lng = parseFloat(r.lng);
    const lat = parseFloat(r.lat);
    const coords: [number, number] = !isNaN(lng) && !isNaN(lat) ? [lng, lat] : (WINDOW_COORDS[r.window_id] || [116.397, 39.907]);
    return {
      windowId: r.window_id,
      windowNo: r.window_no,
      windowName: r.window_name,
      count: parseInt(r.count || 0),
      avgWaitTime: parseFloat(r.avg_wait_time || 0),
      utilization,
      status: utilization > 80 ? 'critical' : utilization > 50 ? 'warning' : 'normal',
      coordinates: coords,
      location: {
        type: 'Point',
        coordinates: coords,
      },
    };
  });

  return { data, source: 'PostGIS' };
}

export async function getPrescriptionDetails(
  filters: FilterState,
  drillDown: DrillDownFilter = {},
  page: number = 1,
  pageSize: number = 50,
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{
  data: { records: Prescription[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } };
  source: string;
}> {
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    throw new Error('PostgreSQL 数据库未连接，无法获取明细数据。');
  }

  const { clause, params } = buildWhereClause(filters, drillDown);

  const countQuery = `
    SELECT COUNT(*) as total
    FROM prescriptions p
    JOIN windows w ON p.window_id = w.id
    ${clause}
  `;
  const countRes = await queryDb(countQuery, params);
  const total = parseInt(countRes.rows[0].total);

  const orderMap: Record<string, string> = {
    prescriptionNo: 'p.prescription_no',
    type: 'p.type',
    departmentName: 'd.dept_name',
    windowNo: 'w.window_no',
    pharmacistName: 'ph.name',
    waitTime: 'p.wait_time_minutes',
    dispenseTime: 'p.dispense_time_minutes',
    createdAt: 'p.created_at',
  };

  const orderColumn = orderMap[sortBy] || 'p.created_at';

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

  const records: Prescription[] = dataRes.rows.map((r: any) => ({
    ...r,
    createdAt: r.createdAt?.toISOString ? r.createdAt.toISOString() : r.createdAt,
    paidAt: r.paidAt?.toISOString ? r.paidAt.toISOString() : r.paidAt,
    dispensedAt: r.dispensedAt?.toISOString ? r.dispensedAt.toISOString() : r.dispensedAt,
    calledAt: r.calledAt?.toISOString ? r.calledAt.toISOString() : r.calledAt,
    pickedAt: r.pickedAt?.toISOString ? r.pickedAt.toISOString() : r.pickedAt,
    refundedAt: r.refundedAt?.toISOString ? r.refundedAt.toISOString() : r.refundedAt,
  }));

  return {
    data: {
      records,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    },
    source: 'PostgreSQL + PostGIS',
  };
}
