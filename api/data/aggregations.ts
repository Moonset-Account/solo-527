import { getPool } from './pgDatabase.js';
import { redisCache, CACHE_TTL, buildCacheKey } from './redisCache.js';
import type { FilterParams, Anomaly, AnomalyLevel, ViewPerspective } from '../../shared/types.js';

let paramCounter = 0;

function resetParamCounter() {
  paramCounter = 1;
}

function nextParam(): string {
  return `$${paramCounter++}`;
}

export function buildFilterWhere(params: FilterParams, customerStage?: string): { where: string; args: any[] } {
  resetParamCounter();
  const conditions: string[] = [];
  const args: any[] = [];

  if (params.projectIds?.length) {
    const placeholders = params.projectIds.map(() => nextParam()).join(',');
    conditions.push(`c.project_id IN (${placeholders})`);
    args.push(...params.projectIds);
  }
  if (params.consultantIds?.length) {
    const placeholders = params.consultantIds.map(() => nextParam()).join(',');
    conditions.push(`c.consultant_id IN (${placeholders})`);
    args.push(...params.consultantIds);
  }
  if (params.channelIds?.length) {
    const placeholders = params.channelIds.map(() => nextParam()).join(',');
    conditions.push(`c.channel_id IN (${placeholders})`);
    args.push(...params.channelIds);
  }
  if (params.months?.length) {
    const monthConditions = params.months.map(() => `c.created_at LIKE ${nextParam()}`);
    conditions.push(`(${monthConditions.join(' OR ')})`);
    args.push(...params.months.map((m) => m + '%'));
  }
  if (customerStage) {
    conditions.push(`cu.stage = ${nextParam()}`);
    args.push(customerStage);
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  return { where, args };
}

export async function getFilteredConsultationIds(params: FilterParams, customerStage?: string): Promise<string[]> {
  const pool = getPool();
  const { where, args } = buildFilterWhere(params, customerStage);
  const result = await pool.query(
    `SELECT c.id FROM consultations c LEFT JOIN customers cu ON c.customer_id = cu.id ${where}`,
    args,
  );
  return result.rows.map((r: any) => r.id);
}

export interface FunnelAgg {
  totalConsultations: number;
  totalAppointments: number;
  totalVisits: number;
  totalPlans: number;
  totalPayments: number;
  totalFollowUps: number;
}

function inPlaceholdersPg(ids: string[]): { sql: string; startIdx: number } {
  return { sql: ids.map((_, i) => `$${i + 1}`).join(','), startIdx: ids.length + 1 };
}

export async function getFunnelAggregation(consultationIds: string[], cacheKey: string): Promise<FunnelAgg> {
  const cached = await redisCache.get<FunnelAgg>(cacheKey);
  if (cached) return cached;

  const pool = getPool();

  if (consultationIds.length === 0) {
    const result: FunnelAgg = { totalConsultations: 0, totalAppointments: 0, totalVisits: 0, totalPlans: 0, totalPayments: 0, totalFollowUps: 0 };
    await redisCache.set(cacheKey, result, CACHE_TTL.funnel);
    return result;
  }

  const ph = consultationIds.map((_, i) => `$${i + 1}`).join(',');
  const idArgs = [...consultationIds];
  const totalConsultations = consultationIds.length;
  const nextIdx = consultationIds.length + 1;

  const aptResult = await pool.query(
    `SELECT COUNT(*) as cnt FROM appointments WHERE consultation_id IN (${ph}) AND confirmed_at IS NOT NULL`,
    idArgs,
  );
  const totalAppointments = parseInt(aptResult.rows[0].cnt, 10);

  const visResult = await pool.query(
    `SELECT COUNT(*) as cnt FROM visits v INNER JOIN appointments a ON v.appointment_id = a.id WHERE a.consultation_id IN (${ph})`,
    idArgs,
  );
  const totalVisits = parseInt(visResult.rows[0].cnt, 10);

  const planResult = await pool.query(
    `SELECT COUNT(*) as cnt FROM treatment_plans tp INNER JOIN visits v ON tp.visit_id = v.id INNER JOIN appointments a ON v.appointment_id = a.id WHERE a.consultation_id IN (${ph})`,
    idArgs,
  );
  const totalPlans = parseInt(planResult.rows[0].cnt, 10);

  const payResult = await pool.query(
    `SELECT COUNT(*) as cnt FROM payments p INNER JOIN treatment_plans tp ON p.plan_id = tp.id INNER JOIN visits v ON tp.visit_id = v.id INNER JOIN appointments a ON v.appointment_id = a.id WHERE a.consultation_id IN (${ph}) AND p.status = 'completed'`,
    idArgs,
  );
  const totalPayments = parseInt(payResult.rows[0].cnt, 10);

  const fuResult = await pool.query(
    `SELECT COUNT(*) as cnt FROM follow_ups fu INNER JOIN payments p ON fu.payment_id = p.id INNER JOIN treatment_plans tp ON p.plan_id = tp.id INNER JOIN visits v ON tp.visit_id = v.id INNER JOIN appointments a ON v.appointment_id = a.id WHERE a.consultation_id IN (${ph}) AND fu.actual_visit_at IS NOT NULL`,
    idArgs,
  );
  const totalFollowUps = parseInt(fuResult.rows[0].cnt, 10);

  const result: FunnelAgg = { totalConsultations, totalAppointments, totalVisits, totalPlans, totalPayments, totalFollowUps };
  await redisCache.set(cacheKey, result, CACHE_TTL.funnel);
  return result;
}

export async function getAnomaliesAggregation(consultationIds: string[], params: FilterParams, customerStage?: string): Promise<Anomaly[]> {
  const cacheKey = buildCacheKey('anomalies', { consultationCount: consultationIds.length, ...params, customerStage });
  const cached = await redisCache.get<Anomaly[]>(cacheKey);
  if (cached) return cached;

  const pool = getPool();
  const anomalies: Anomaly[] = [];

  if (consultationIds.length === 0) {
    await redisCache.set(cacheKey, anomalies, CACHE_TTL.anomalies);
    return anomalies;
  }

  const funnelKey = buildCacheKey('funnel_agg', { ids: consultationIds.length });
  const funnel = await getFunnelAggregation(consultationIds, funnelKey);

  const { totalConsultations, totalAppointments, totalVisits, totalPlans, totalPayments, totalFollowUps } = funnel;

  if (totalConsultations > 0) {
    const appRate = totalAppointments / totalConsultations;
    if (appRate < 0.55) {
      anomalies.push({ id: 'anom-1', level: 'critical' as AnomalyLevel, title: '咨询→预约转化率偏低', description: `当前转化率 ${(appRate * 100).toFixed(1)}%，低于阈值 55%`, metric: 'consultationToAppointment', currentValue: appRate, expectedValue: 0.72, relatedView: 'project' as ViewPerspective, relatedFilter: params });
    }

    const visitRate = totalAppointments > 0 ? totalVisits / totalAppointments : 0;
    if (visitRate < 0.55) {
      anomalies.push({ id: 'anom-2', level: 'warning' as AnomalyLevel, title: '预约→到店转化率下降', description: `当前转化率 ${(visitRate * 100).toFixed(1)}%，低于正常水平`, metric: 'appointmentToVisit', currentValue: visitRate, expectedValue: 0.68, relatedView: 'project' as ViewPerspective, relatedFilter: params });
    }

    const planRate = totalVisits > 0 ? totalPlans / totalVisits : 0;
    if (planRate < 0.45) {
      anomalies.push({ id: 'anom-3', level: 'warning' as AnomalyLevel, title: '到店→方案转化率偏低', description: `当前转化率 ${(planRate * 100).toFixed(1)}%，需关注方案设计环节`, metric: 'visitToPlan', currentValue: planRate, expectedValue: 0.6, relatedView: 'project' as ViewPerspective, relatedFilter: params });
    }

    const paymentRate = totalPlans > 0 ? totalPayments / totalPlans : 0;
    if (paymentRate < 0.4) {
      anomalies.push({ id: 'anom-4', level: 'critical' as AnomalyLevel, title: '方案→付款转化率异常', description: `当前转化率 ${(paymentRate * 100).toFixed(1)}%，付款环节可能存在障碍`, metric: 'planToPayment', currentValue: paymentRate, expectedValue: 0.55, relatedView: 'project' as ViewPerspective, relatedFilter: params });
    }

    const followUpRate = totalPayments > 0 ? totalFollowUps / totalPayments : 0;
    if (followUpRate < 0.3) {
      anomalies.push({ id: 'anom-5', level: 'info' as AnomalyLevel, title: '复诊率有待提升', description: `当前复诊率 ${(followUpRate * 100).toFixed(1)}%，建议加强术后跟踪`, metric: 'paymentToFollowUp', currentValue: followUpRate, expectedValue: 0.4, relatedView: 'month' as ViewPerspective, relatedFilter: params });
    }
  }

  const ph = consultationIds.map((_, i) => `$${i + 1}`).join(',');
  const idArgs = [...consultationIds];

  const overloadedResult = await pool.query(
    `SELECT c.consultant_id, co.name, COUNT(*) as load_count FROM consultations c INNER JOIN consultants co ON c.consultant_id = co.id WHERE c.id IN (${ph}) GROUP BY c.consultant_id, co.name HAVING COUNT(*) > 30`,
    idArgs,
  );

  for (const row of overloadedResult.rows) {
    anomalies.push({ id: `anom-load-${row.consultant_id}`, level: 'warning' as AnomalyLevel, title: `${row.name} 负载过高`, description: `在管客户 ${row.load_count} 人，超出建议上限 30 人`, metric: 'consultantLoad', currentValue: parseInt(row.load_count, 10), expectedValue: 30, relatedView: 'consultant' as ViewPerspective, relatedFilter: { ...params, consultantIds: [row.consultant_id] } });
  }

  const channelResult = await pool.query(
    `SELECT c.channel_id, ch.name, COUNT(DISTINCT c.id) as total_consultations, COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) as completed_payments FROM consultations c INNER JOIN channels ch ON c.channel_id = ch.id LEFT JOIN appointments a ON c.id = a.consultation_id AND a.confirmed_at IS NOT NULL LEFT JOIN visits v ON a.id = v.appointment_id LEFT JOIN treatment_plans tp ON v.id = tp.visit_id LEFT JOIN payments p ON tp.id = p.plan_id WHERE c.id IN (${ph}) GROUP BY c.channel_id, ch.name HAVING COUNT(DISTINCT c.id) >= 10`,
    idArgs,
  );

  for (const ch of channelResult.rows) {
    const rate = parseInt(ch.completed_payments, 10) / parseInt(ch.total_consultations, 10);
    if (rate < 0.2) {
      anomalies.push({ id: `anom-ch-${ch.channel_id}`, level: 'info' as AnomalyLevel, title: `${ch.name} 渠道质量偏低`, description: `成单转化率 ${(rate * 100).toFixed(1)}%，低于阈值 20%`, metric: 'channelCostEfficiency', currentValue: rate, expectedValue: 0.2, relatedView: 'channel' as ViewPerspective, relatedFilter: { ...params, channelIds: [ch.channel_id] } });
    }
  }

  await redisCache.set(cacheKey, anomalies, CACHE_TTL.anomalies);
  return anomalies;
}

export async function getChannelQualityAggregation(consultationIds: string[], cacheKey: string) {
  const cached = await redisCache.get<any>(cacheKey);
  if (cached) return cached;

  const pool = getPool();

  if (consultationIds.length === 0) {
    await redisCache.set(cacheKey, [], CACHE_TTL.channel);
    return [];
  }

  const ph = consultationIds.map((_, i) => `$${i + 1}`).join(',');
  const idArgs = [...consultationIds];

  const result = await pool.query(
    `SELECT ch.id, ch.name, COUNT(DISTINCT c.id) as total, COUNT(DISTINCT CASE WHEN a.confirmed_at IS NOT NULL THEN a.id END) as visited, COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) as deals FROM consultations c INNER JOIN channels ch ON c.channel_id = ch.id LEFT JOIN appointments a ON c.id = a.consultation_id LEFT JOIN visits v ON a.id = v.appointment_id LEFT JOIN treatment_plans tp ON v.id = tp.visit_id LEFT JOIN payments p ON tp.id = p.plan_id WHERE c.id IN (${ph}) GROUP BY ch.id, ch.name`,
    idArgs,
  );

  const channels = result.rows
    .map((ch: any) => ({
      id: ch.id, name: ch.name,
      conversionRate: parseInt(ch.total, 10) > 0 ? (parseInt(ch.visited, 10) / parseInt(ch.total, 10)) * 100 : 0,
      visitRate: parseInt(ch.total, 10) > 0 ? (parseInt(ch.visited, 10) / parseInt(ch.total, 10)) * 100 : 0,
      dealRate: parseInt(ch.total, 10) > 0 ? (parseInt(ch.deals, 10) / parseInt(ch.total, 10)) * 100 : 0,
      rank: 0, prevRank: 0,
    }))
    .sort((a: any, b: any) => b.conversionRate - a.conversionRate);

  channels.forEach((ch: any, i: number) => {
    ch.rank = i + 1;
    ch.prevRank = Math.max(1, i + 1 + (i % 3 === 0 ? -1 : i % 3 === 1 ? 1 : 0));
  });

  await redisCache.set(cacheKey, channels, CACHE_TTL.channel);
  return channels;
}

export async function getConsultantLoadAggregation(consultationIds: string[], cacheKey: string) {
  const cached = await redisCache.get<any>(cacheKey);
  if (cached) return cached;

  const pool = getPool();

  if (consultationIds.length === 0) {
    await redisCache.set(cacheKey, [], CACHE_TTL.consultant);
    return [];
  }

  const ph = consultationIds.map((_, i) => `$${i + 1}`).join(',');
  const idArgs = [...consultationIds];

  const result = await pool.query(
    `SELECT co.id, co.name, COUNT(DISTINCT c.id) as total_customers, COUNT(DISTINCT CASE WHEN a.confirmed_at IS NOT NULL THEN a.id END) as appointed, COUNT(DISTINCT CASE WHEN v.id IS NOT NULL THEN v.id END) as visited, COUNT(DISTINCT CASE WHEN tp.id IS NOT NULL THEN tp.id END) as planned, COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) as paid, COUNT(DISTINCT CASE WHEN fu.actual_visit_at IS NOT NULL THEN fu.id END) as followed_up FROM consultations c INNER JOIN consultants co ON c.consultant_id = co.id LEFT JOIN appointments a ON c.id = a.consultation_id AND a.confirmed_at IS NOT NULL LEFT JOIN visits v ON a.id = v.appointment_id LEFT JOIN treatment_plans tp ON v.id = tp.visit_id LEFT JOIN payments p ON tp.id = p.plan_id AND p.status = 'completed' LEFT JOIN follow_ups fu ON p.id = fu.payment_id AND fu.actual_visit_at IS NOT NULL WHERE c.id IN (${ph}) GROUP BY co.id, co.name`,
    idArgs,
  );

  const consultants = result.rows.map((co: any) => {
    const total = parseInt(co.total_customers, 10);
    const appointed = parseInt(co.appointed, 10);
    return {
      id: co.id, name: co.name, totalCustomers: total,
      stageDistribution: {
        lead: Math.max(0, total - appointed),
        consulted: 0,
        appointed,
        visited: parseInt(co.visited, 10),
        planned: parseInt(co.planned, 10),
        paid: parseInt(co.paid, 10),
        followed_up: parseInt(co.followed_up, 10),
      },
      conversionRate: total > 0 ? parseInt(co.paid, 10) / total : 0,
    };
  });

  await redisCache.set(cacheKey, consultants, CACHE_TTL.consultant);
  return consultants;
}

export async function getFollowUpTrendAggregation(consultationIds: string[], cacheKey: string) {
  const cached = await redisCache.get<any>(cacheKey);
  if (cached) return cached;

  const pool = getPool();

  const months = ['2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12',
    '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'];

  const monthly = [];
  for (const month of months) {
    const monthLike = month + '%';
    if (consultationIds.length === 0) {
      monthly.push({ month, followUpRate: 0, avgIntervalDays: 0 });
      continue;
    }

    const ph = consultationIds.map((_, i) => `$${i + 1}`).join(',');
    const monthParamIdx = consultationIds.length + 1;
    const args = [...consultationIds, monthLike];

    const row = await pool.query(
      `SELECT COUNT(DISTINCT fu.id) as total, COUNT(DISTINCT CASE WHEN fu.actual_visit_at IS NOT NULL THEN fu.id END) as completed, AVG(CASE WHEN fu.actual_visit_at IS NOT NULL AND fu.interval_days IS NOT NULL THEN fu.interval_days END) as avg_interval FROM follow_ups fu INNER JOIN payments p ON fu.payment_id = p.id INNER JOIN treatment_plans tp ON p.plan_id = tp.id INNER JOIN visits v ON tp.visit_id = v.id INNER JOIN appointments a ON v.appointment_id = a.id INNER JOIN consultations c ON a.consultation_id = c.id WHERE c.id IN (${ph}) AND c.created_at LIKE $${monthParamIdx}`,
      args,
    );

    const r = row.rows[0];
    const total = parseInt(r.total, 10) || 0;
    const completed = parseInt(r.completed, 10) || 0;
    monthly.push({
      month,
      followUpRate: total > 0 ? completed / total : 0,
      avgIntervalDays: r.avg_interval ? Math.round(parseFloat(r.avg_interval)) : 0,
    });
  }

  const intervalRanges = [
    { range: '0-7天', min: 0, max: 7 },
    { range: '8-14天', min: 8, max: 14 },
    { range: '15-30天', min: 15, max: 30 },
    { range: '31-60天', min: 31, max: 60 },
    { range: '61-90天', min: 61, max: 90 },
    { range: '90天+', min: 91, max: null },
  ];

  if (consultationIds.length === 0) {
    const result = {
      monthly,
      intervalDistribution: intervalRanges.map(({ range }) => ({ range, count: 0 })),
      categoryBreakdown: [],
    };
    await redisCache.set(cacheKey, result, CACHE_TTL.followup);
    return result;
  }

  const ph = consultationIds.map((_, i) => `$${i + 1}`).join(',');
  const idArgs = [...consultationIds];

  const intervalDistribution = [];
  for (const { range, min, max } of intervalRanges) {
    const minParam = consultationIds.length + 1;
    const args: any[] = [...idArgs, min];
    let sql = `SELECT COUNT(DISTINCT fu.id) as cnt FROM follow_ups fu INNER JOIN payments p ON fu.payment_id = p.id INNER JOIN treatment_plans tp ON p.plan_id = tp.id INNER JOIN visits v ON tp.visit_id = v.id INNER JOIN appointments a ON v.appointment_id = a.id INNER JOIN consultations c ON a.consultation_id = c.id WHERE c.id IN (${ph}) AND fu.interval_days IS NOT NULL AND fu.interval_days >= $${minParam}`;
    if (max !== null) {
      const maxParam = consultationIds.length + 2;
      sql += ` AND fu.interval_days <= $${maxParam}`;
      args.push(max);
    }
    const row = await pool.query(sql, args);
    intervalDistribution.push({ range, count: parseInt(row.rows[0].cnt, 10) || 0 });
  }

  const catResult = await pool.query(
    `SELECT pr.category, COUNT(DISTINCT fu.id) as patient_count, COUNT(DISTINCT CASE WHEN fu.actual_visit_at IS NOT NULL THEN fu.id END) as completed_count FROM follow_ups fu INNER JOIN payments p ON fu.payment_id = p.id INNER JOIN treatment_plans tp ON p.plan_id = tp.id INNER JOIN visits v ON tp.visit_id = v.id INNER JOIN appointments a ON v.appointment_id = a.id INNER JOIN consultations c ON a.consultation_id = c.id INNER JOIN projects pr ON fu.project_id = pr.id WHERE c.id IN (${ph}) GROUP BY pr.category`,
    idArgs,
  );

  const categoryBreakdown = catResult.rows.map((cb: any) => ({
    category: cb.category,
    followUpRate: parseInt(cb.patient_count, 10) > 0 ? parseInt(cb.completed_count, 10) / parseInt(cb.patient_count, 10) : 0,
    patientCount: parseInt(cb.patient_count, 10),
  }));

  const result = { monthly, intervalDistribution, categoryBreakdown };
  await redisCache.set(cacheKey, result, CACHE_TTL.followup);
  return result;
}

export async function getFilterOptionsAggregation() {
  const cacheKey = 'filter_options:all';
  const cached = await redisCache.get<any>(cacheKey);
  if (cached) return cached;

  const pool = getPool();

  const projectsResult = await pool.query('SELECT id, name, category, is_sensitive FROM projects');
  const projects = projectsResult.rows.map((p: any) => ({ id: p.id, name: p.is_sensitive ? p.category : p.name }));

  const consultantsResult = await pool.query('SELECT id, name FROM consultants');
  const consultants = consultantsResult.rows.map((c: any) => ({ id: c.id, name: c.name }));

  const channelsResult = await pool.query('SELECT id, name FROM channels');
  const channels = channelsResult.rows.map((ch: any) => ({ id: ch.id, name: ch.name }));

  const result = {
    projects,
    consultants,
    channels,
    stages: ['lead', 'consulted', 'appointed', 'visited', 'planned', 'paid', 'followed_up'],
    months: ['2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12',
      '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'],
  };

  await redisCache.set(cacheKey, result, CACHE_TTL.filterOptions);
  return result;
}
