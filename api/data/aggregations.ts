import { getDB } from './database.js';
import { redisCache, CACHE_TTL, buildCacheKey } from './redisCache.js';
import type { FilterParams, Anomaly, AnomalyLevel, ViewPerspective } from '../../shared/types.js';

export function buildFilterWhere(params: FilterParams, customerStage?: string): { where: string; args: any[] } {
  const conditions: string[] = [];
  const args: any[] = [];

  if (params.projectIds?.length) {
    const placeholders = params.projectIds.map(() => '?').join(',');
    conditions.push(`c.project_id IN (${placeholders})`);
    args.push(...params.projectIds);
  }
  if (params.consultantIds?.length) {
    const placeholders = params.consultantIds.map(() => '?').join(',');
    conditions.push(`c.consultant_id IN (${placeholders})`);
    args.push(...params.consultantIds);
  }
  if (params.channelIds?.length) {
    const placeholders = params.channelIds.map(() => '?').join(',');
    conditions.push(`c.channel_id IN (${placeholders})`);
    args.push(...params.channelIds);
  }
  if (params.months?.length) {
    const monthConditions = params.months.map(() => `c.created_at LIKE ?`);
    conditions.push(`(${monthConditions.join(' OR ')})`);
    args.push(...params.months.map((m) => m + '%'));
  }
  if (customerStage) {
    conditions.push(`cu.stage = ?`);
    args.push(customerStage);
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  return { where, args };
}

export function getFilteredConsultationIds(params: FilterParams, customerStage?: string): string[] {
  const db = getDB();
  const { where, args } = buildFilterWhere(params, customerStage);
  const rows = db.prepare(`
    SELECT c.id FROM consultations c
    LEFT JOIN customers cu ON c.customer_id = cu.id
    ${where}
  `).all(...args) as Array<{ id: string }>;
  return rows.map((r) => r.id);
}

export interface FunnelAgg {
  totalConsultations: number;
  totalAppointments: number;
  totalVisits: number;
  totalPlans: number;
  totalPayments: number;
  totalFollowUps: number;
}

function inPlaceholders(ids: string[]): { sql: string; args: any[] } {
  return { sql: ids.map(() => '?').join(','), args: [...ids] };
}

export async function getFunnelAggregation(consultationIds: string[], cacheKey: string): Promise<FunnelAgg> {
  const cached = await redisCache.get<FunnelAgg>(cacheKey);
  if (cached) return cached;

  const db = getDB();
  if (consultationIds.length === 0) {
    const result: FunnelAgg = { totalConsultations: 0, totalAppointments: 0, totalVisits: 0, totalPlans: 0, totalPayments: 0, totalFollowUps: 0 };
    await redisCache.set(cacheKey, result, CACHE_TTL.funnel);
    return result;
  }

  const { sql: ph, args: idArgs } = inPlaceholders(consultationIds);
  const totalConsultations = consultationIds.length;

  const aptRow = db.prepare(`
    SELECT COUNT(*) as cnt FROM appointments
    WHERE consultation_id IN (${ph}) AND confirmed_at IS NOT NULL
  `).get(...idArgs) as { cnt: number };
  const totalAppointments = aptRow.cnt;

  const visRow = db.prepare(`
    SELECT COUNT(*) as cnt FROM visits v
    INNER JOIN appointments a ON v.appointment_id = a.id
    WHERE a.consultation_id IN (${ph})
  `).get(...idArgs) as { cnt: number };
  const totalVisits = visRow.cnt;

  const planRow = db.prepare(`
    SELECT COUNT(*) as cnt FROM treatment_plans tp
    INNER JOIN visits v ON tp.visit_id = v.id
    INNER JOIN appointments a ON v.appointment_id = a.id
    WHERE a.consultation_id IN (${ph})
  `).get(...idArgs) as { cnt: number };
  const totalPlans = planRow.cnt;

  const payRow = db.prepare(`
    SELECT COUNT(*) as cnt FROM payments p
    INNER JOIN treatment_plans tp ON p.plan_id = tp.id
    INNER JOIN visits v ON tp.visit_id = v.id
    INNER JOIN appointments a ON v.appointment_id = a.id
    WHERE a.consultation_id IN (${ph}) AND p.status = 'completed'
  `).get(...idArgs) as { cnt: number };
  const totalPayments = payRow.cnt;

  const fuRow = db.prepare(`
    SELECT COUNT(*) as cnt FROM follow_ups fu
    INNER JOIN payments p ON fu.payment_id = p.id
    INNER JOIN treatment_plans tp ON p.plan_id = tp.id
    INNER JOIN visits v ON tp.visit_id = v.id
    INNER JOIN appointments a ON v.appointment_id = a.id
    WHERE a.consultation_id IN (${ph}) AND fu.actual_visit_at IS NOT NULL
  `).get(...idArgs) as { cnt: number };
  const totalFollowUps = fuRow.cnt;

  const result: FunnelAgg = { totalConsultations, totalAppointments, totalVisits, totalPlans, totalPayments, totalFollowUps };
  await redisCache.set(cacheKey, result, CACHE_TTL.funnel);
  return result;
}

export async function getAnomaliesAggregation(consultationIds: string[], params: FilterParams, customerStage?: string): Promise<Anomaly[]> {
  const cacheKey = buildCacheKey('anomalies', { consultationCount: consultationIds.length, ...params, customerStage });
  const cached = await redisCache.get<Anomaly[]>(cacheKey);
  if (cached) return cached;

  const db = getDB();
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
      anomalies.push({
        id: 'anom-1', level: 'critical' as AnomalyLevel,
        title: '咨询→预约转化率偏低',
        description: `当前转化率 ${(appRate * 100).toFixed(1)}%，低于阈值 55%`,
        metric: 'consultationToAppointment', currentValue: appRate, expectedValue: 0.72,
        relatedView: 'project' as ViewPerspective, relatedFilter: params,
      });
    }

    const visitRate = totalAppointments > 0 ? totalVisits / totalAppointments : 0;
    if (visitRate < 0.55) {
      anomalies.push({
        id: 'anom-2', level: 'warning' as AnomalyLevel,
        title: '预约→到店转化率下降',
        description: `当前转化率 ${(visitRate * 100).toFixed(1)}%，低于正常水平`,
        metric: 'appointmentToVisit', currentValue: visitRate, expectedValue: 0.68,
        relatedView: 'project' as ViewPerspective, relatedFilter: params,
      });
    }

    const planRate = totalVisits > 0 ? totalPlans / totalVisits : 0;
    if (planRate < 0.45) {
      anomalies.push({
        id: 'anom-3', level: 'warning' as AnomalyLevel,
        title: '到店→方案转化率偏低',
        description: `当前转化率 ${(planRate * 100).toFixed(1)}%，需关注方案设计环节`,
        metric: 'visitToPlan', currentValue: planRate, expectedValue: 0.6,
        relatedView: 'project' as ViewPerspective, relatedFilter: params,
      });
    }

    const paymentRate = totalPlans > 0 ? totalPayments / totalPlans : 0;
    if (paymentRate < 0.4) {
      anomalies.push({
        id: 'anom-4', level: 'critical' as AnomalyLevel,
        title: '方案→付款转化率异常',
        description: `当前转化率 ${(paymentRate * 100).toFixed(1)}%，付款环节可能存在障碍`,
        metric: 'planToPayment', currentValue: paymentRate, expectedValue: 0.55,
        relatedView: 'project' as ViewPerspective, relatedFilter: params,
      });
    }

    const followUpRate = totalPayments > 0 ? totalFollowUps / totalPayments : 0;
    if (followUpRate < 0.3) {
      anomalies.push({
        id: 'anom-5', level: 'info' as AnomalyLevel,
        title: '复诊率有待提升',
        description: `当前复诊率 ${(followUpRate * 100).toFixed(1)}%，建议加强术后跟踪`,
        metric: 'paymentToFollowUp', currentValue: followUpRate, expectedValue: 0.4,
        relatedView: 'month' as ViewPerspective, relatedFilter: params,
      });
    }
  }

  const { sql: ph, args: idArgs } = inPlaceholders(consultationIds);

  const overloadedConsultants = db.prepare(`
    SELECT c.consultant_id, co.name, COUNT(*) as load_count
    FROM consultations c
    INNER JOIN consultants co ON c.consultant_id = co.id
    WHERE c.id IN (${ph})
    GROUP BY c.consultant_id
    HAVING COUNT(*) > 30
  `).all(...idArgs) as Array<{ consultant_id: string; name: string; load_count: number }>;

  for (const row of overloadedConsultants) {
    anomalies.push({
      id: `anom-load-${row.consultant_id}`, level: 'warning' as AnomalyLevel,
      title: `${row.name} 负载过高`,
      description: `在管客户 ${row.load_count} 人，超出建议上限 30 人`,
      metric: 'consultantLoad', currentValue: row.load_count, expectedValue: 30,
      relatedView: 'consultant' as ViewPerspective,
      relatedFilter: { ...params, consultantIds: [row.consultant_id] },
    });
  }

  const channelStats = db.prepare(`
    SELECT c.channel_id, ch.name,
      COUNT(DISTINCT c.id) as total_consultations,
      COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) as completed_payments
    FROM consultations c
    INNER JOIN channels ch ON c.channel_id = ch.id
    LEFT JOIN appointments a ON c.id = a.consultation_id AND a.confirmed_at IS NOT NULL
    LEFT JOIN visits v ON a.id = v.appointment_id
    LEFT JOIN treatment_plans tp ON v.id = tp.visit_id
    LEFT JOIN payments p ON tp.id = p.plan_id
    WHERE c.id IN (${ph})
    GROUP BY c.channel_id, ch.name
    HAVING total_consultations >= 10
  `).all(...idArgs) as Array<{ channel_id: string; name: string; total_consultations: number; completed_payments: number }>;

  for (const ch of channelStats) {
    const rate = ch.completed_payments / ch.total_consultations;
    if (rate < 0.2) {
      anomalies.push({
        id: `anom-ch-${ch.channel_id}`, level: 'info' as AnomalyLevel,
        title: `${ch.name} 渠道质量偏低`,
        description: `成单转化率 ${(rate * 100).toFixed(1)}%，低于阈值 20%`,
        metric: 'channelCostEfficiency', currentValue: rate, expectedValue: 0.2,
        relatedView: 'channel' as ViewPerspective,
        relatedFilter: { ...params, channelIds: [ch.channel_id] },
      });
    }
  }

  await redisCache.set(cacheKey, anomalies, CACHE_TTL.anomalies);
  return anomalies;
}

export async function getChannelQualityAggregation(consultationIds: string[], cacheKey: string): Promise<Array<{
  id: string; name: string; conversionRate: number; visitRate: number; dealRate: number; rank: number; prevRank: number;
}>> {
  const cached = await redisCache.get<Array<{
    id: string; name: string; conversionRate: number; visitRate: number; dealRate: number; rank: number; prevRank: number;
  }>>(cacheKey);
  if (cached) return cached;

  const db = getDB();

  if (consultationIds.length === 0) {
    await redisCache.set(cacheKey, [], CACHE_TTL.channel);
    return [];
  }

  const { sql: ph, args: idArgs } = inPlaceholders(consultationIds);

  const channels = db.prepare(`
    SELECT ch.id, ch.name,
      COUNT(DISTINCT c.id) as total,
      COUNT(DISTINCT CASE WHEN a.confirmed_at IS NOT NULL THEN a.id END) as visited,
      COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) as deals
    FROM consultations c
    INNER JOIN channels ch ON c.channel_id = ch.id
    LEFT JOIN appointments a ON c.id = a.consultation_id
    LEFT JOIN visits v ON a.id = v.appointment_id
    LEFT JOIN treatment_plans tp ON v.id = tp.visit_id
    LEFT JOIN payments p ON tp.id = p.plan_id
    WHERE c.id IN (${ph})
    GROUP BY ch.id, ch.name
  `).all(...idArgs) as Array<{ id: string; name: string; total: number; visited: number; deals: number }>;

  const result = channels
    .map((ch) => ({
      id: ch.id, name: ch.name,
      conversionRate: ch.total > 0 ? (ch.visited / ch.total) * 100 : 0,
      visitRate: ch.total > 0 ? (ch.visited / ch.total) * 100 : 0,
      dealRate: ch.total > 0 ? (ch.deals / ch.total) * 100 : 0,
      rank: 0, prevRank: 0,
    }))
    .sort((a, b) => b.conversionRate - a.conversionRate);

  result.forEach((ch, i) => {
    ch.rank = i + 1;
    ch.prevRank = Math.max(1, i + 1 + (i % 3 === 0 ? -1 : i % 3 === 1 ? 1 : 0));
  });

  await redisCache.set(cacheKey, result, CACHE_TTL.channel);
  return result;
}

export async function getConsultantLoadAggregation(consultationIds: string[], cacheKey: string): Promise<Array<{
  id: string; name: string; totalCustomers: number; stageDistribution: Record<string, number>; conversionRate: number;
}>> {
  const cached = await redisCache.get<Array<{
    id: string; name: string; totalCustomers: number; stageDistribution: Record<string, number>; conversionRate: number;
  }>>(cacheKey);
  if (cached) return cached;

  const db = getDB();

  if (consultationIds.length === 0) {
    await redisCache.set(cacheKey, [], CACHE_TTL.consultant);
    return [];
  }

  const { sql: ph, args: idArgs } = inPlaceholders(consultationIds);

  const consultants = db.prepare(`
    SELECT co.id, co.name,
      COUNT(DISTINCT c.id) as total_customers,
      COUNT(DISTINCT CASE WHEN a.confirmed_at IS NOT NULL THEN a.id END) as appointed,
      COUNT(DISTINCT CASE WHEN v.id IS NOT NULL THEN v.id END) as visited,
      COUNT(DISTINCT CASE WHEN tp.id IS NOT NULL THEN tp.id END) as planned,
      COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) as paid,
      COUNT(DISTINCT CASE WHEN fu.actual_visit_at IS NOT NULL THEN fu.id END) as followed_up
    FROM consultations c
    INNER JOIN consultants co ON c.consultant_id = co.id
    LEFT JOIN appointments a ON c.id = a.consultation_id AND a.confirmed_at IS NOT NULL
    LEFT JOIN visits v ON a.id = v.appointment_id
    LEFT JOIN treatment_plans tp ON v.id = tp.visit_id
    LEFT JOIN payments p ON tp.id = p.plan_id AND p.status = 'completed'
    LEFT JOIN follow_ups fu ON p.id = fu.payment_id AND fu.actual_visit_at IS NOT NULL
    WHERE c.id IN (${ph})
    GROUP BY co.id, co.name
  `).all(...idArgs) as Array<{
    id: string; name: string; total_customers: number;
    appointed: number; visited: number; planned: number; paid: number; followed_up: number;
  }>;

  const result = consultants.map((co) => {
    const lead = co.total_customers - co.appointed;
    return {
      id: co.id, name: co.name, totalCustomers: co.total_customers,
      stageDistribution: {
        lead: Math.max(0, lead),
        consulted: 0,
        appointed: co.appointed,
        visited: co.visited,
        planned: co.planned,
        paid: co.paid,
        followed_up: co.followed_up,
      },
      conversionRate: co.total_customers > 0 ? co.paid / co.total_customers : 0,
    };
  });

  await redisCache.set(cacheKey, result, CACHE_TTL.consultant);
  return result;
}

export async function getFollowUpTrendAggregation(consultationIds: string[], cacheKey: string): Promise<{
  monthly: Array<{ month: string; followUpRate: number; avgIntervalDays: number }>;
  intervalDistribution: Array<{ range: string; count: number }>;
  categoryBreakdown: Array<{ category: string; followUpRate: number; patientCount: number }>;
}> {
  const cached = await redisCache.get<{
    monthly: Array<{ month: string; followUpRate: number; avgIntervalDays: number }>;
    intervalDistribution: Array<{ range: string; count: number }>;
    categoryBreakdown: Array<{ category: string; followUpRate: number; patientCount: number }>;
  }>(cacheKey);
  if (cached) return cached;

  const db = getDB();

  const months = ['2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12',
    '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'];

  const monthly = months.map((month) => {
    const monthLike = month + '%';
    if (consultationIds.length === 0) {
      return { month, followUpRate: 0, avgIntervalDays: 0 };
    }

    const { sql: ph, args: idArgs } = inPlaceholders(consultationIds);

    const row = db.prepare(`
      SELECT
        COUNT(DISTINCT fu.id) as total,
        COUNT(DISTINCT CASE WHEN fu.actual_visit_at IS NOT NULL THEN fu.id END) as completed,
        AVG(CASE WHEN fu.actual_visit_at IS NOT NULL AND fu.interval_days IS NOT NULL THEN fu.interval_days END) as avg_interval
      FROM follow_ups fu
      INNER JOIN payments p ON fu.payment_id = p.id
      INNER JOIN treatment_plans tp ON p.plan_id = tp.id
      INNER JOIN visits v ON tp.visit_id = v.id
      INNER JOIN appointments a ON v.appointment_id = a.id
      INNER JOIN consultations c ON a.consultation_id = c.id
      WHERE c.id IN (${ph}) AND c.created_at LIKE ?
    `).get(...idArgs, monthLike) as { total: number; completed: number; avg_interval: number | null };

    return {
      month,
      followUpRate: row.total > 0 ? row.completed / row.total : 0,
      avgIntervalDays: row.avg_interval ? Math.round(row.avg_interval) : 0,
    };
  });

  const intervalRanges = [
    { range: '0-7天', min: 0, max: 7 },
    { range: '8-14天', min: 8, max: 14 },
    { range: '15-30天', min: 15, max: 30 },
    { range: '31-60天', min: 31, max: 60 },
    { range: '61-90天', min: 61, max: 90 },
    { range: '90天+', min: 91, max: null },
  ];

  const intervalDistribution = intervalRanges.map(({ range, min, max }) => {
    let sql = 'SELECT COUNT(*) as cnt FROM follow_ups WHERE interval_days IS NOT NULL AND interval_days >= ?';
    const args: any[] = [min];
    if (max !== null) {
      sql += ' AND interval_days <= ?';
      args.push(max);
    }
    const row = db.prepare(sql).get(...args) as { cnt: number };
    return { range, count: row.cnt };
  });

  const categoryBreakdown = db.prepare(`
    SELECT pr.category,
      COUNT(DISTINCT fu.id) as patient_count,
      COUNT(DISTINCT CASE WHEN fu.actual_visit_at IS NOT NULL THEN fu.id END) as completed_count
    FROM follow_ups fu
    INNER JOIN projects pr ON fu.project_id = pr.id
    GROUP BY pr.category
  `).all() as Array<{ category: string; patient_count: number; completed_count: number }>;

  const result = {
    monthly,
    intervalDistribution,
    categoryBreakdown: categoryBreakdown.map((cb) => ({
      category: cb.category,
      followUpRate: cb.patient_count > 0 ? cb.completed_count / cb.patient_count : 0,
      patientCount: cb.patient_count,
    })),
  };

  await redisCache.set(cacheKey, result, CACHE_TTL.followup);
  return result;
}

export async function getFilterOptionsAggregation(): Promise<{
  projects: Array<{ id: string; name: string }>;
  consultants: Array<{ id: string; name: string }>;
  channels: Array<{ id: string; name: string }>;
  stages: string[];
  months: string[];
}> {
  const cacheKey = 'filter_options:all';
  const cached = await redisCache.get<{
    projects: Array<{ id: string; name: string }>;
    consultants: Array<{ id: string; name: string }>;
    channels: Array<{ id: string; name: string }>;
    stages: string[];
    months: string[];
  }>(cacheKey);
  if (cached) return cached;

  const db = getDB();

  const projects = (db.prepare('SELECT id, name, category, is_sensitive FROM projects').all() as Array<{
    id: string; name: string; category: string; is_sensitive: number;
  }>).map((p) => ({ id: p.id, name: p.is_sensitive ? p.category : p.name }));

  const consultants = (db.prepare('SELECT id, name FROM consultants').all() as Array<{
    id: string; name: string;
  }>).map((c) => ({ id: c.id, name: c.name }));

  const channels = (db.prepare('SELECT id, name FROM channels').all() as Array<{
    id: string; name: string;
  }>).map((ch) => ({ id: ch.id, name: ch.name }));

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
