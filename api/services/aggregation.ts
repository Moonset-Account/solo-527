import db from '../database.js';
import type {
  FilterParams,
  FunnelStage,
  StageName,
  ChannelMetrics,
  InterviewerLoad,
  FilterOptions,
  AnomalyAnnotation,
  MetricDefinition,
  CandidateExperience,
} from '../../shared/types.js';

const STAGE_LABELS: Record<StageName, string> = {
  posted: '已发布',
  applied: '已申请',
  screened: '已筛选',
  interviewed: '已面试',
  offered: '已发Offer',
  hired: '已入职',
};

const STAGE_ORDER: StageName[] = ['posted', 'applied', 'screened', 'interviewed', 'offered', 'hired'];

function buildFilterWhere(filters: FilterParams, tableAlias?: string): { sql: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  const prefix = tableAlias ? `${tableAlias}.` : '';

  if (filters.positions && filters.positions.length > 0) {
    const placeholders = filters.positions.map(() => '?').join(',');
    conditions.push(`${prefix}position_id IN (${placeholders})`);
    params.push(...filters.positions);
  }

  if (filters.departments && filters.departments.length > 0) {
    const placeholders = filters.departments.map(() => '?').join(',');
    conditions.push(`${prefix}position_id IN (SELECT id FROM positions WHERE department IN (${placeholders}))`);
    params.push(...filters.departments);
  }

  if (filters.recruiters && filters.recruiters.length > 0) {
    const placeholders = filters.recruiters.map(() => '?').join(',');
    conditions.push(`${prefix}position_id IN (SELECT id FROM positions WHERE recruiter IN (${placeholders}))`);
    params.push(...filters.recruiters);
  }

  if (filters.channels && filters.channels.length > 0) {
    const placeholders = filters.channels.map(() => '?').join(',');
    conditions.push(`${prefix}channel IN (${placeholders})`);
    params.push(...filters.channels);
  }

  if (filters.stages && filters.stages.length > 0) {
    const placeholders = filters.stages.map(() => '?').join(',');
    conditions.push(`${prefix}id IN (SELECT candidate_id FROM pipeline_stages WHERE stage IN (${placeholders}))`);
    params.push(...filters.stages);
  }

  if (filters.interviewerScope) {
    conditions.push(`${prefix}id IN (SELECT candidate_id FROM interviews WHERE interviewer_id = ?)`);
    params.push(filters.interviewerScope);
  }

  if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
    conditions.push(`${prefix}created_at >= ? AND ${prefix}created_at <= ?`);
    params.push(filters.dateRange.start, filters.dateRange.end + ' 23:59:59');
  }

  const sql = conditions.length > 0 ? ' AND ' + conditions.join(' AND ') : '';
  return { sql, params };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile90(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil(0.9 * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function getFunnelData(filters: FilterParams): FunnelStage[] {
  const { sql: whereSql, params } = buildFilterWhere(filters, 'c');
  const candidateIds = db.prepare(
    `SELECT c.id FROM candidates c WHERE 1=1${whereSql}`
  ).all(...params) as { id: string }[];

  const idList = candidateIds.map(c => c.id);

  const activeStages = filters.stages && filters.stages.length > 0
    ? STAGE_ORDER.filter(s => filters.stages!.includes(s))
    : STAGE_ORDER;

  if (idList.length === 0) {
    return activeStages.map(stage => ({
      stage,
      stageLabel: STAGE_LABELS[stage],
      count: 0,
      conversionRate: 0,
      avgDaysInStage: 0,
      medianDaysInStage: 0,
      p90DaysInStage: 0,
    }));
  }

  const stageCounts: Record<StageName, number> = {
    posted: 0, applied: 0, screened: 0, interviewed: 0, offered: 0, hired: 0,
  };
  const stageDurations: Record<StageName, number[]> = {
    posted: [], applied: [], screened: [], interviewed: [], offered: [], hired: [],
  };

  const placeholders = idList.map(() => '?').join(',');
  const stages = db.prepare(
    `SELECT candidate_id, stage, entered_at, exited_at FROM pipeline_stages WHERE candidate_id IN (${placeholders})`
  ).all(...idList) as { candidate_id: string; stage: StageName; entered_at: string; exited_at: string | null }[];

  const candidateStages = new Map<string, Set<string>>();
  for (const s of stages) {
    if (!candidateStages.has(s.candidate_id)) {
      candidateStages.set(s.candidate_id, new Set());
    }
    candidateStages.get(s.candidate_id)!.add(s.stage);
    stageCounts[s.stage]++;
    if (s.exited_at) {
      const entered = new Date(s.entered_at).getTime();
      const exited = new Date(s.exited_at).getTime();
      const days = (exited - entered) / 86400000;
      if (days >= 0) {
        stageDurations[s.stage].push(Math.round(days * 10) / 10);
      }
    }
  }

  const totalCandidates = idList.length;
  return activeStages.map((stage) => {
    const orderIdx = STAGE_ORDER.indexOf(stage);
    const count = stageCounts[stage];
    const prevStage = orderIdx > 0 ? STAGE_ORDER[orderIdx - 1] : null;
    const prevCount = prevStage ? stageCounts[prevStage as StageName] : totalCandidates;
    const conversionRate = prevCount > 0 ? Math.round((count / prevCount) * 10000) / 100 : 0;

    const durations = stageDurations[stage];
    const avg = durations.length > 0 ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10 : 0;
    const med = median(durations);
    const p90 = percentile90(durations);

    return {
      stage,
      stageLabel: STAGE_LABELS[stage],
      count,
      conversionRate,
      avgDaysInStage: avg,
      medianDaysInStage: Math.round(med * 10) / 10,
      p90DaysInStage: Math.round(p90 * 10) / 10,
    };
  });
}

export function getStageDuration(filters: FilterParams): { stage: StageName; stageLabel: string; durations: number[]; avg: number; median: number; p90: number }[] {
  const { sql: whereSql, params } = buildFilterWhere(filters, 'c');
  const candidateIds = db.prepare(
    `SELECT c.id FROM candidates c WHERE 1=1${whereSql}`
  ).all(...params) as { id: string }[];

  const idList = candidateIds.map(c => c.id);

  const activeStages = filters.stages && filters.stages.length > 0
    ? STAGE_ORDER.filter(s => filters.stages!.includes(s))
    : STAGE_ORDER;

  if (idList.length === 0) {
    return activeStages.map(stage => ({
      stage,
      stageLabel: STAGE_LABELS[stage],
      durations: [],
      avg: 0,
      median: 0,
      p90: 0,
    }));
  }

  const stageFilterSql = filters.stages && filters.stages.length > 0
    ? ` AND stage IN (${filters.stages.map(() => '?').join(',')})`
    : '';
  const stageFilterParams = filters.stages && filters.stages.length > 0 ? filters.stages : [];

  const placeholders = idList.map(() => '?').join(',');
  const stages = db.prepare(
    `SELECT stage, entered_at, exited_at FROM pipeline_stages WHERE candidate_id IN (${placeholders}) AND exited_at IS NOT NULL${stageFilterSql}`
  ).all(...idList, ...stageFilterParams) as { stage: StageName; entered_at: string; exited_at: string }[];

  const stageDurations: Record<StageName, number[]> = {
    posted: [], applied: [], screened: [], interviewed: [], offered: [], hired: [],
  };

  for (const s of stages) {
    const days = (new Date(s.exited_at).getTime() - new Date(s.entered_at).getTime()) / 86400000;
    if (days >= 0) {
      stageDurations[s.stage].push(Math.round(days * 10) / 10);
    }
  }

  return activeStages.map(stage => {
    const durations = stageDurations[stage];
    const avg = durations.length > 0 ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10 : 0;
    return {
      stage,
      stageLabel: STAGE_LABELS[stage],
      durations,
      avg,
      median: Math.round(median(durations) * 10) / 10,
      p90: Math.round(percentile90(durations) * 10) / 10,
    };
  });
}

export function getChannelMetrics(filters: FilterParams): ChannelMetrics[] {
  const { sql: whereSql, params } = buildFilterWhere(filters, 'c');
  const candidates = db.prepare(
    `SELECT c.id, c.channel, c.created_at FROM candidates c WHERE 1=1${whereSql}`
  ).all(...params) as { id: string; channel: string; created_at: string }[];

  const channelGroups = new Map<string, string[]>();
  for (const c of candidates) {
    if (!channelGroups.has(c.channel)) {
      channelGroups.set(c.channel, []);
    }
    channelGroups.get(c.channel)!.push(c.id);
  }

  const costMap: Record<string, number> = {
    '猎聘': 3500,
    'BOSS直聘': 1200,
    '内推': 500,
    '官网': 300,
    '拉勾': 2000,
    '猎头': 8000,
  };

  const results: ChannelMetrics[] = [];

  for (const [channel, candIds] of channelGroups) {
    const totalApplied = candIds.length;
    if (totalApplied === 0) continue;

    const placeholders = candIds.map(() => '?').join(',');
    const hiredStages = db.prepare(
      `SELECT COUNT(*) as cnt FROM pipeline_stages WHERE candidate_id IN (${placeholders}) AND stage = 'hired'`
    ).get(...candIds) as { cnt: number };

    const hiredCount = hiredStages.cnt;
    const conversionRate = Math.round((hiredCount / totalApplied) * 10000) / 100;

    const hiredWithTiming = db.prepare(
      `SELECT ps1.entered_at as posted_at, ps2.entered_at as hired_at
       FROM pipeline_stages ps1
       JOIN pipeline_stages ps2 ON ps1.candidate_id = ps2.candidate_id
       WHERE ps1.stage = 'posted' AND ps2.stage = 'hired'
       AND ps1.candidate_id IN (${placeholders})`
    ).all(...candIds) as { posted_at: string; hired_at: string }[];

    const avgTimeToHire = hiredWithTiming.length > 0
      ? Math.round((hiredWithTiming.reduce((sum, r) => {
          return sum + (new Date(r.hired_at).getTime() - new Date(r.posted_at).getTime()) / 86400000;
        }, 0) / hiredWithTiming.length) * 10) / 10
      : 0;

    const costPerHire = hiredCount > 0 ? Math.round((costMap[channel] || 1000) * totalApplied / hiredCount) : costMap[channel] || 1000;

    const stageTimingRows = db.prepare(
      `SELECT ps.stage, AVG((julianday(ps.exited_at) - julianday(ps.entered_at)) * 24 * 60) as avg_hours
       FROM pipeline_stages ps
       WHERE ps.candidate_id IN (${placeholders}) AND ps.exited_at IS NOT NULL
       GROUP BY ps.stage`
    ).all(...candIds) as { stage: string; avg_hours: number }[];

    const stageTimings: Record<string, number> = {};
    for (const row of stageTimingRows) {
      stageTimings[row.stage] = Math.round(row.avg_hours * 10) / 10;
    }

    const satisfactionRow = db.prepare(
      `SELECT AVG(satisfaction_score) as avg_score, COUNT(*) as cnt FROM interviews WHERE candidate_id IN (${placeholders}) AND satisfaction_score IS NOT NULL`
    ).get(...candIds) as { avg_score: number | null; cnt: number };

    const avgSatisfaction = satisfactionRow.avg_score !== null
      ? Math.round(satisfactionRow.avg_score * 10) / 10
      : 0;

    results.push({
      channel,
      totalApplied,
      conversionRate,
      avgTimeToHire,
      costPerHire,
      stageTimings,
      satisfactionScore: avgSatisfaction || 4.0,
      avgSatisfaction,
    });
  }

  return results;
}

export function getInterviewerLoad(filters: FilterParams): InterviewerLoad[] {
  const interviewers = db.prepare(
    `SELECT id, name, department FROM interviewers`
  ).all() as { id: string; name: string; department: string }[];

  let deptFilter = '';
  const deptParams: unknown[] = [];
  if (filters.departments && filters.departments.length > 0) {
    const placeholders = filters.departments.map(() => '?').join(',');
    deptFilter = ` AND department IN (${placeholders})`;
    deptParams.push(...filters.departments);
  }

  const filteredInterviewers = filters.departments && filters.departments.length > 0
    ? interviewers.filter(iv => filters.departments!.includes(iv.department))
    : interviewers;

  const results: InterviewerLoad[] = [];

  for (const iv of filteredInterviewers) {
    const totalSessions = db.prepare(
      `SELECT COUNT(*) as cnt FROM interviews WHERE interviewer_id = ?`
    ).get(iv.id) as { cnt: number };

    const feedbackStats = db.prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN feedback_submitted_at IS NOT NULL THEN 1 ELSE 0 END) as completed
      FROM interviews WHERE interviewer_id = ?`
    ).get(iv.id) as { total: number; completed: number };

    const avgFeedbackHours = db.prepare(
      `SELECT AVG((julianday(feedback_submitted_at) - julianday(interview_date)) * 24) as avg_hours
       FROM interviews WHERE interviewer_id = ? AND feedback_submitted_at IS NOT NULL`
    ).get(iv.id) as { avg_hours: number | null };

    const weeklySessions: number[] = [];
    for (let w = 0; w < 8; w++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (7 - w) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const count = db.prepare(
        `SELECT COUNT(*) as cnt FROM interviews WHERE interviewer_id = ? AND interview_date >= ? AND interview_date < ?`
      ).get(iv.id, weekStart.toISOString().slice(0, 10), weekEnd.toISOString().slice(0, 10)) as { cnt: number };
      weeklySessions.push(count.cnt);
    }

    const feedbackCompletionRate = feedbackStats.total > 0
      ? Math.round((feedbackStats.completed / feedbackStats.total) * 10000) / 100
      : 0;

    results.push({
      interviewerId: iv.id,
      interviewerName: iv.name,
      department: iv.department,
      totalSessions: totalSessions.cnt,
      weeklySessions,
      avgFeedbackHours: avgFeedbackHours.avg_hours !== null
        ? Math.round(avgFeedbackHours.avg_hours * 10) / 10
        : 0,
      feedbackCompletionRate,
    });
  }

  return results;
}

export function getFilterOptions(): FilterOptions {
  const positions = db.prepare(
    `SELECT DISTINCT id, title FROM positions ORDER BY department, title`
  ).all() as { id: string; title: string }[];

  const departments = db.prepare(
    `SELECT DISTINCT department FROM positions ORDER BY department`
  ).all() as { department: string }[];

  const recruiters = db.prepare(
    `SELECT DISTINCT recruiter FROM positions ORDER BY recruiter`
  ).all() as { recruiter: string }[];

  const channels = db.prepare(
    `SELECT DISTINCT channel FROM candidates ORDER BY channel`
  ).all() as { channel: string }[];

  return {
    positions: positions.map(p => p.id),
    departments: departments.map(d => d.department),
    recruiters: recruiters.map(r => r.recruiter),
    channels: channels.map(c => c.channel),
    stages: STAGE_ORDER,
  };
}

export function getAnnotations(stage?: string, metric?: string): AnomalyAnnotation[] {
  let sql = 'SELECT * FROM annotations WHERE 1=1';
  const params: unknown[] = [];

  if (stage) {
    sql += ' AND stage = ?';
    params.push(stage);
  }
  if (metric) {
    sql += ' AND metric = ?';
    params.push(metric);
  }

  sql += ' ORDER BY date DESC';

  return db.prepare(sql).all(...params) as AnomalyAnnotation[];
}

export function createAnnotation(annotation: Omit<AnomalyAnnotation, 'id' | 'createdAt'>): AnomalyAnnotation {
  const id = 'ann-' + Date.now();
  const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

  db.prepare(
    `INSERT INTO annotations (id, date, stage, metric, value, comment, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, annotation.date, annotation.stage, annotation.metric, annotation.value, annotation.comment, annotation.createdBy, createdAt);

  return {
    id,
    date: annotation.date,
    stage: annotation.stage,
    metric: annotation.metric,
    value: annotation.value,
    comment: annotation.comment,
    createdBy: annotation.createdBy,
    createdAt,
  };
}

export function getMetricDefinitions(): MetricDefinition[] {
  return db.prepare('SELECT * FROM metric_definitions ORDER BY id').all() as MetricDefinition[];
}

export function getCandidateExperience(filters: FilterParams): CandidateExperience {
  const { sql: whereSql, params } = buildFilterWhere(filters, 'c');
  const candidateIds = db.prepare(
    `SELECT c.id FROM candidates c WHERE 1=1${whereSql}`
  ).all(...params) as { id: string }[];

  const idList = candidateIds.map(c => c.id);
  if (idList.length === 0) {
    return {
      avgSatisfaction: 0,
      totalFeedbacks: 0,
      satisfactionDistribution: {},
      avgFeedbackDelayHours: 0,
    };
  }

  const placeholders = idList.map(() => '?').join(',');

  const stats = db.prepare(
    `SELECT AVG(satisfaction_score) as avg_score, COUNT(*) as cnt FROM interviews WHERE candidate_id IN (${placeholders}) AND satisfaction_score IS NOT NULL`
  ).get(...idList) as { avg_score: number | null; cnt: number };

  const distributionRows = db.prepare(
    `SELECT ROUND(satisfaction_score) as score_bucket, COUNT(*) as cnt FROM interviews WHERE candidate_id IN (${placeholders}) AND satisfaction_score IS NOT NULL GROUP BY ROUND(satisfaction_score) ORDER BY score_bucket`
  ).all(...idList) as { score_bucket: number; cnt: number }[];

  const satisfactionDistribution: Record<string, number> = {};
  for (const row of distributionRows) {
    satisfactionDistribution[String(row.score_bucket)] = row.cnt;
  }

  const delayStats = db.prepare(
    `SELECT AVG((julianday(feedback_submitted_at) - julianday(interview_date)) * 24) as avg_hours FROM interviews WHERE candidate_id IN (${placeholders}) AND feedback_submitted_at IS NOT NULL`
  ).get(...idList) as { avg_hours: number | null };

  return {
    avgSatisfaction: stats.avg_score !== null ? Math.round(stats.avg_score * 10) / 10 : 0,
    totalFeedbacks: stats.cnt,
    satisfactionDistribution,
    avgFeedbackDelayHours: delayStats.avg_hours !== null ? Math.round(delayStats.avg_hours * 10) / 10 : 0,
  };
}
