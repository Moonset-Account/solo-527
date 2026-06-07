import { getDb, runQuery } from './db.js';
import { seedDatabase } from './seed.js';
import type {
  FilterState,
  FunnelData,
  FunnelStage,
  CancellationDetail,
  SalesLoad,
  ScheduleConflict,
  ConversionData,
  CarModel,
  Store,
  Salesperson
} from '$lib/types.js';

function toNum(v: unknown): number {
  if (typeof v === 'bigint') return Number(v);
  if (typeof v === 'number') return v;
  return 0;
}

let seeded = false;

export function resetSeeded() {
  seeded = false;
}

async function ensureSeeded() {
  if (!seeded) {
    await seedDatabase();
    seeded = true;
  }
}

function buildWhereClause(filters: Partial<FilterState>, alias: string = 'a'): string {
  const conditions: string[] = ['1=1'];
  if (filters.model_id) conditions.push(`${alias}.model_id = '${filters.model_id}'`);
  if (filters.sales_id) conditions.push(`${alias}.sales_id = '${filters.sales_id}'`);
  if (filters.source) conditions.push(`${alias}.source = '${filters.source}'`);
  if (filters.store_id) conditions.push(`${alias}.store_id = '${filters.store_id}'`);
  if (filters.is_visited === 'true') conditions.push(`${alias}.is_visited = TRUE`);
  else if (filters.is_visited === 'false') conditions.push(`${alias}.is_visited = FALSE`);
  if (filters.period_start) conditions.push(`${alias}.appointment_time >= '${filters.period_start}'`);
  if (filters.period_end) conditions.push(`${alias}.appointment_time <= '${filters.period_end}'`);
  return conditions.join(' AND ');
}

function buildDedupCte(filters: Partial<FilterState>, alias: string = 'a'): string {
  const where = buildWhereClause(filters, alias);
  return `
    SELECT * FROM (
      SELECT ${alias}.*,
        ROW_NUMBER() OVER (
          PARTITION BY c.phone_hash
          ORDER BY ${alias}.created_at ASC
        ) as rn
      FROM appointments ${alias}
      JOIN customers c ON ${alias}.customer_id = c.id
      WHERE ${where}
    ) sub
    WHERE rn = 1
  `;
}

export async function getFunnelData(filters: Partial<FilterState>): Promise<FunnelData> {
  await ensureSeeded();
  const db = await getDb();
  const dedupSql = buildDedupCte(filters);

  const stagesSql = `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status IN ('已确认','已到店','已完成') THEN 1 ELSE 0 END) as confirmed,
      SUM(CASE WHEN is_visited = TRUE THEN 1 ELSE 0 END) as visited,
      SUM(CASE WHEN status = '已完成' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN conversion_type IS NOT NULL THEN 1 ELSE 0 END) as converted
    FROM (${dedupSql}) dedup
  `;

  const stagesResult = await runQuery(db, stagesSql) as Record<string, unknown>[];
  const row = stagesResult[0];

  const stages: FunnelStage[] = [
    { name: '预约提交', count: toNum(row.total) },
    { name: '确认到店', count: toNum(row.confirmed) },
    { name: '实际到店', count: toNum(row.visited) },
    { name: '完成试驾', count: toNum(row.completed) },
    { name: '成交转化', count: toNum(row.converted) }
  ];

  const byModelSql = `
    SELECT
      m.name as model_name,
      COUNT(*) as total,
      SUM(CASE WHEN dedup.status IN ('已确认','已到店','已完成') THEN 1 ELSE 0 END) as confirmed,
      SUM(CASE WHEN dedup.is_visited = TRUE THEN 1 ELSE 0 END) as visited,
      SUM(CASE WHEN dedup.status = '已完成' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN dedup.conversion_type IS NOT NULL THEN 1 ELSE 0 END) as converted
    FROM (${dedupSql}) dedup
    JOIN car_models m ON dedup.model_id = m.id
    GROUP BY m.name
    ORDER BY total DESC
  `;

  const byModelResult = await runQuery(db, byModelSql) as Record<string, unknown>[];
  const by_model: Record<string, FunnelStage[]> = {};

  for (const r of byModelResult) {
    const name = r.model_name as string;
    by_model[name] = [
      { name: '预约提交', count: toNum(r.total) },
      { name: '确认到店', count: toNum(r.confirmed) },
      { name: '实际到店', count: toNum(r.visited) },
      { name: '完成试驾', count: toNum(r.completed) },
      { name: '成交转化', count: toNum(r.converted) }
    ];
  }

  return { stages, by_model };
}

export async function getCancellationDetails(filters: Partial<FilterState>): Promise<CancellationDetail[]> {
  await ensureSeeded();
  const db = await getDb();
  const dedupSql = buildDedupCte(filters);

  const cancelledSql = `
    SELECT
      COALESCE(cancellation_reason, '未指定') as reason,
      COUNT(*) as count,
      FALSE as is_no_show,
      SUM(CASE WHEN cancellation_reason = '车型缺货' THEN 1 ELSE 0 END) as model_out_of_stock,
      SUM(CASE WHEN cancellation_reason = '客户主动改约' THEN 1 ELSE 0 END) as customer_reschedule
    FROM (${dedupSql}) dedup
    WHERE dedup.status = '已取消'
    GROUP BY cancellation_reason
  `;

  const noShowSql = `
    SELECT
      COALESCE(no_show_reason, '未指定') as reason,
      COUNT(*) as count,
      TRUE as is_no_show,
      0 as model_out_of_stock,
      0 as customer_reschedule
    FROM (${dedupSql}) dedup
    WHERE dedup.status = '爽约'
    GROUP BY no_show_reason
  `;

  const cancelled = await runQuery(db, cancelledSql) as Record<string, unknown>[];
  const noShows = await runQuery(db, noShowSql) as Record<string, unknown>[];

  const all = [...cancelled, ...noShows];
  const total = all.reduce((sum, r) => sum + toNum(r.count), 0);

  return all.map(r => ({
    reason: r.reason as string,
    count: toNum(r.count),
    percentage: total > 0 ? Math.round((toNum(r.count) / total) * 10000) / 100 : 0,
    is_no_show: r.is_no_show as boolean,
    model_out_of_stock: toNum(r.model_out_of_stock),
    customer_reschedule: toNum(r.customer_reschedule)
  }));
}

const salesLoadCache = new Map<string, { data: SalesLoad[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function getSalesLoad(filters: Partial<FilterState>): Promise<SalesLoad[]> {
  await ensureSeeded();
  const db = await getDb();
  const cacheKey = JSON.stringify(filters);
  const cached = salesLoadCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const dedupSql = buildDedupCte(filters);

  const sql = `
    SELECT
      sp.id as sales_id,
      sp.name as sales_name,
      st.name as store_name,
      COUNT(*) as appointment_count,
      SUM(CASE WHEN dedup.status = '已完成' THEN 1 ELSE 0 END) as completed_count,
      SUM(CASE WHEN dedup.status = '已取消' THEN 1 ELSE 0 END) as cancelled_count,
      SUM(CASE WHEN dedup.status = '爽约' THEN 1 ELSE 0 END) as no_show_count
    FROM (${dedupSql}) dedup
    JOIN salespeople sp ON dedup.sales_id = sp.id
    JOIN stores st ON sp.store_id = st.id
    GROUP BY sp.id, sp.name, st.name
    ORDER BY appointment_count DESC
  `;

  const rows = await runQuery(db, sql) as Record<string, unknown>[];

  const conflicts = await getScheduleConflicts(filters);

  const result: SalesLoad[] = rows.map(r => {
    const count = toNum(r.appointment_count);
    let load_level: SalesLoad['load_level'] = 'normal';
    if (count <= 3) load_level = 'low';
    else if (count <= 7) load_level = 'normal';
    else if (count <= 10) load_level = 'high';
    else load_level = 'overloaded';

    return {
      sales_id: r.sales_id as string,
      sales_name: r.sales_name as string,
      store_name: r.store_name as string,
      appointment_count: count,
      completed_count: toNum(r.completed_count),
      cancelled_count: toNum(r.cancelled_count),
      no_show_count: toNum(r.no_show_count),
      load_level,
      schedule_conflicts: conflicts.filter(c =>
        c.sales_name === (r.sales_name as string)
      )
    };
  });

  salesLoadCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

export async function getScheduleConflicts(filters: Partial<FilterState>): Promise<ScheduleConflict[]> {
  await ensureSeeded();
  const db = await getDb();

  const where1 = buildWhereClause(filters, 'a1');
  const where2 = buildWhereClause(filters, 'a2');

  const sql = `
    SELECT
      a1.id as appointment_id_1,
      a2.id as appointment_id_2,
      sp.name as sales_name,
      a1.appointment_time as time_1,
      a2.appointment_time as time_2,
      CASE
        WHEN ABS(EXTRACT(EPOCH FROM (a2.appointment_time - a1.appointment_time))) < 3600 THEN 'overlap'
        ELSE 'back_to_back'
      END as conflict_type
    FROM appointments a1
    JOIN appointments a2 ON a1.sales_id = a2.sales_id AND a1.id < a2.id
    JOIN salespeople sp ON a1.sales_id = sp.id
    WHERE a1.status IN ('待确认','已确认')
      AND a2.status IN ('待确认','已确认')
      AND ABS(EXTRACT(EPOCH FROM (a2.appointment_time - a1.appointment_time))) < 7200
      AND ${where1}
      AND ${where2}
  `;

  const rows = await runQuery(db, sql) as Record<string, unknown>[];
  return rows.map(r => ({
    appointment_id_1: r.appointment_id_1 as string,
    appointment_id_2: r.appointment_id_2 as string,
    sales_name: r.sales_name as string,
    time_1: r.time_1 as string,
    time_2: r.time_2 as string,
    conflict_type: r.conflict_type as 'overlap' | 'back_to_back'
  }));
}

export async function getConversionData(filters: Partial<FilterState>): Promise<ConversionData[]> {
  await ensureSeeded();
  const db = await getDb();
  const dedupSql = buildDedupCte(filters);

  const sql = `
    SELECT
      m.id as model_id,
      m.name as model_name,
      SUM(CASE WHEN dedup.status = '已完成' THEN 1 ELSE 0 END) as total_completed,
      SUM(CASE WHEN dedup.conversion_type = '到店成交' THEN 1 ELSE 0 END) as in_store_conversion,
      SUM(CASE WHEN dedup.conversion_type = '后续成交' THEN 1 ELSE 0 END) as follow_up_conversion,
      SUM(CASE WHEN dedup.is_vehicle_swapped = TRUE THEN 1 ELSE 0 END) as vehicle_swap_count,
      SUM(CASE WHEN dedup.is_vehicle_swapped = TRUE AND dedup.original_model_id != dedup.model_id THEN 1 ELSE 0 END) as original_model_preserved
    FROM (${dedupSql}) dedup
    JOIN car_models m ON dedup.model_id = m.id
    GROUP BY m.id, m.name
    ORDER BY total_completed DESC
  `;

  const rows = await runQuery(db, sql) as Record<string, unknown>[];

  return rows.map(r => {
    const total = toNum(r.total_completed);
    const inStore = toNum(r.in_store_conversion);
    const followUp = toNum(r.follow_up_conversion);
    return {
      model_id: r.model_id as string,
      model_name: r.model_name as string,
      total_completed: total,
      in_store_conversion: inStore,
      follow_up_conversion: followUp,
      in_store_rate: total > 0 ? Math.round((inStore / total) * 10000) / 100 : 0,
      follow_up_rate: total > 0 ? Math.round((followUp / total) * 10000) / 100 : 0,
      total_rate: total > 0 ? Math.round(((inStore + followUp) / total) * 10000) / 100 : 0,
      vehicle_swap_count: toNum(r.vehicle_swap_count),
      original_model_preserved: toNum(r.original_model_preserved)
    };
  });
}

export async function getFilterOptions(): Promise<{
  models: CarModel[];
  stores: Store[];
  salespeople: Salesperson[];
  sources: string[];
}> {
  await ensureSeeded();
  const db = await getDb();

  const models = await runQuery(db, 'SELECT * FROM car_models ORDER BY name') as CarModel[];
  const stores = await runQuery(db, 'SELECT * FROM stores ORDER BY name') as Store[];
  const salespeople = await runQuery(db, 'SELECT * FROM salespeople ORDER BY name') as Salesperson[];
  const sources = ['线上官网', 'APP', '小程序', '到店咨询', '电话预约', '老客推荐'];

  return { models, stores, salespeople, sources };
}

export async function getExportData(filters: Partial<FilterState>): Promise<Record<string, unknown>[]> {
  await ensureSeeded();
  const db = await getDb();
  const dedupSql = buildDedupCte(filters);

  const sql = `
    SELECT
      dedup.id as 预约编号,
      c.name as 客户姓名,
      c.phone as 联系电话,
      m1.name as 预约车型,
      m2.name as 原始预约车型,
      sp.name as 销售顾问,
      st.name as 门店,
      dedup.source as 预约来源,
      dedup.status as 预约状态,
      dedup.appointment_time as 预约时间,
      dedup.created_at as 创建时间,
      CASE WHEN dedup.is_visited THEN '是' ELSE '否' END as 是否到店,
      COALESCE(dedup.cancellation_reason, '') as 取消原因,
      COALESCE(dedup.no_show_reason, '') as 爽约原因,
      COALESCE(dedup.conversion_type, '') as 成交类型,
      CASE WHEN dedup.is_vehicle_swapped THEN '是' ELSE '否' END as 是否调车,
      CASE WHEN dedup.is_duplicate_customer THEN '是' ELSE '否' END as 重复客户,
      dedup.remark as 备注
    FROM (${dedupSql}) dedup
    JOIN customers c ON dedup.customer_id = c.id
    JOIN car_models m1 ON dedup.model_id = m1.id
    JOIN car_models m2 ON dedup.original_model_id = m2.id
    JOIN salespeople sp ON dedup.sales_id = sp.id
    JOIN stores st ON dedup.store_id = st.id
    ORDER BY dedup.appointment_time DESC
  `;

  return (await runQuery(db, sql)) as Record<string, unknown>[];
}
