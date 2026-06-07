const express = require('express');
const router = express.Router();
const mockData = require('../data/mockData');
const { metricsConfig, radarMetrics } = require('../data/metricsConfig');
const etlService = require('../services/etlService');
const exportService = require('../services/exportService');
const authMiddleware = require('../middleware/auth');
const dataService = require('../services/dataService');

const {
  athletes,
  coaches,
  sports,
  exercises,
  actualTrainings,
  heartRateData,
  paceData
} = mockData;

const enforceScope = (req, queryField = 'athleteId') => {
  if (req.dataScope && req.dataScope.type === 'self') {
    return req.dataScope.athleteId;
  }
  return req.query[queryField];
};

router.get('/athletes', authMiddleware.enforceDataPermission.bind(authMiddleware), async (req, res) => {
  const { sport } = req.query;

  const result = await dataService.getAthletes();
  let list = result.rows;

  if (req.dataScope && req.dataScope.type === 'self') {
    list = list.filter(a => a.id === req.dataScope.athleteId);
  } else if (sport) {
    list = list.filter(a => a.sport === sport);
  }

  res.json(list);
});

router.get('/sports', (req, res) => {
  res.json(sports.map(s => ({ id: s, name: s })));
});

router.get('/exercises', (req, res) => {
  const { sport } = req.query;
  res.json(exercises.map(e => ({ id: e, name: e })));
});

router.get('/metrics-config', (req, res) => {
  res.json({ metrics: metricsConfig, radarMetrics });
});

router.get('/training/load-curve', authMiddleware.enforceDataPermission.bind(authMiddleware), async (req, res) => {
  const effectiveAthleteId = enforceScope(req);
  const { sport, startDate, endDate, exercise, metric = 'load' } = req.query;

  const result = await dataService.getLoadCurve({
    athleteId: effectiveAthleteId,
    sport,
    startDate,
    endDate,
    exercise
  });

  const response = {
    data: result.rows,
    anomalies: result.anomalies,
    summary: result.summary,
    dataScope: req.dataScope,
    _meta: {
      cached: result.cached,
      cacheKey: result.cacheKey,
      queryMeta: result.queryMeta
    }
  };

  res.json(response);
});

router.get('/training/radar', authMiddleware.enforceDataPermission.bind(authMiddleware), async (req, res) => {
  let athleteId = enforceScope(req);

  if (!athleteId) {
    return res.status(400).json({ error: '请选择队员' });
  }

  const result = await dataService.getRadarMetrics(athleteId);

  if (!result.found) {
    return res.status(404).json({ error: '队员不存在' });
  }

  const row = result.rows[0];
  res.json({
    athlete: row.athlete,
    radarData: row.radar_data,
    teamAvg: row.team_avg,
    _meta: {
      cached: result.cached,
      cacheKey: result.cacheKey
    }
  });
});

router.get('/recovery/trend', authMiddleware.enforceDataPermission.bind(authMiddleware), async (req, res) => {
  const effectiveAthleteId = enforceScope(req);
  const { startDate, endDate } = req.query;

  const result = await dataService.getRecoveryTrend({
    athleteId: effectiveAthleteId,
    startDate,
    endDate
  });

  const response = {
    data: result.rows,
    anomalies: result.anomalies,
    summary: result.summary,
    _meta: {
      cached: result.cached,
      cacheKey: result.cacheKey,
      queryMeta: result.queryMeta
    }
  };

  res.json(response);
});

router.get('/training/comparison', authMiddleware.requireCoach.bind(authMiddleware), async (req, res) => {
  const { athleteIds, metric = 'load', startDate, endDate } = req.query;
  const ids = Array.isArray(athleteIds) ? athleteIds : [athleteIds];

  if (!ids || ids.length === 0) {
    return res.json([]);
  }

  const result = await dataService.getTrainingComparison({
    athleteIds: ids,
    metric,
    startDate,
    endDate
  });

  const comparisonData = result.rows.map(r => ({
    athleteId: r.athlete_id,
    athleteName: r.athlete_name,
    sport: r.sport,
    data: r.data,
    total: r.total,
    average: r.average
  }));

  res.json(comparisonData);
});

router.get('/training/detail/:id', authMiddleware.enforceDataPermission.bind(authMiddleware), async (req, res) => {
  const { id } = req.params;
  const result = await dataService.getTrainingDetail(id);

  if (!result.found || result.rows.length === 0) {
    return res.status(404).json({ error: '训练记录不存在' });
  }

  const row = result.rows[0];
  const training = row.training;

  if (req.dataScope && req.dataScope.type === 'self' && training.athleteId !== req.dataScope.athleteId) {
    return res.status(403).json({ error: '权限不足：只能查看自己的训练记录' });
  }

  const paceForExercise = paceData.find(
    p => p.athleteId === training.athleteId && p.date === training.date && p.exercise === training.exercise
  );

  res.json({
    training,
    plan: row.plan,
    heartRate: row.heart_rate,
    pace: paceForExercise || null,
    planComparison: row.planComparison,
    deviationAnalysis: row.deviation_analysis,
    rawRecord: row.raw_record,
    _meta: {
      cached: result.cached,
      cacheKey: result.cacheKey,
      queryMeta: result.queryMeta
    }
  });
});

router.get('/injuries', authMiddleware.enforceDataPermission.bind(authMiddleware), async (req, res) => {
  let athleteId = enforceScope(req);
  const userRole = req.user?.role;

  const result = await dataService.getInjuryRecords(athleteId);
  let filtered = result.rows;

  const canViewInternal = authMiddleware.canViewInternalNotes(userRole);
  if (!canViewInternal) {
    filtered = filtered.map(({ internalNotes, ...rest }) => rest);
  }

  res.json(filtered);
});

router.get('/training-plans', authMiddleware.enforceDataPermission.bind(authMiddleware), async (req, res) => {
  let athleteId = enforceScope(req);
  const { date, adjustedOnly } = req.query;

  const result = await dataService.getTrainingPlans({
    athleteId,
    date,
    adjustedOnly
  });

  res.json(result.rows);
});

router.get('/acwr', authMiddleware.enforceDataPermission.bind(authMiddleware), async (req, res) => {
  let athleteId = enforceScope(req);
  if (!athleteId) {
    return res.status(400).json({ error: '请指定队员' });
  }

  const { date } = req.query;
  const result = await dataService.getACWR(athleteId, date);

  res.json(result.rows[0]);
});

router.get('/training/day/:date', authMiddleware.enforceDataPermission.bind(authMiddleware), async (req, res) => {
  const { date } = req.params;
  let athleteId = enforceScope(req);

  const result = await dataService.getDayTrainings(date, athleteId);

  const withPlans = result.rows.map(row => ({
    training: row.training,
    plan: row.plan,
    calculatedLoad: row.calculatedLoad,
    deviation: row.deviation,
    planComparison: row.planComparison,
    deviationAnalysis: row.deviation || null
  }));

  res.json({
    data: withPlans,
    hasAdjusted: result.hasAdjusted,
    _meta: {
      cached: result.cached,
      cacheKey: result.cacheKey,
      queryMeta: result.queryMeta
    }
  });
});

router.get('/export/training', authMiddleware.enforceDataPermission.bind(authMiddleware), async (req, res) => {
  let athleteId = enforceScope(req);
  if (!athleteId) {
    return res.status(400).json({ error: '请指定队员' });
  }

  const { startDate, endDate, format = 'xlsx' } = req.query;

  const data = {
    trainings: actualTrainings.filter(t =>
      t.athleteId === athleteId &&
      (!startDate || t.date >= startDate) &&
      (!endDate || t.date <= endDate)
    ),
    recovery: mockData.recoveryScores.filter(r =>
      r.athleteId === athleteId &&
      (!startDate || r.date >= startDate) &&
      (!endDate || r.date <= endDate)
    ),
    plans: mockData.trainingPlans.filter(p =>
      p.athleteId === athleteId &&
      (!startDate || p.date >= startDate) &&
      (!endDate || p.date <= endDate)
    ).map(p => ({
      ...p,
      originalIntensity: p.originalIntensity || '',
      adjustedIntensity: p.adjusted ? p.adjustedIntensity : '',
      adjustmentReason: p.adjustmentReason || ''
    }))
  };

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="training-data-${athleteId}.json"`);
    return res.json(data);
  }

  const buffer = await exportService.exportToExcel(
    data,
    [
      { name: '训练记录', dataKey: 'trainings' },
      { name: '恢复数据', dataKey: 'recovery' },
      { name: '训练计划', dataKey: 'plans' }
    ],
    `training-export-${athleteId}`
  );

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="training-data-${athleteId}.xlsx"`);
  res.send(buffer);
});

router.get('/system/stats', authMiddleware.requireCoach.bind(authMiddleware), async (req, res) => {
  const stats = await dataService.getSystemStats();
  res.json(stats);
});

router.post('/auth/login', (req, res) => {
  const { username, password, role } = req.body;

  let user = null;
  let tokenRole = role || 'athlete';

  if (role === 'coach' || role === 'rehab' || role === 'head') {
    user = coaches.find(c => c.id === username);
    tokenRole = user?.role || role;
  } else {
    user = athletes.find(a => a.id === username);
  }

  if (!user) {
    return res.status(401).json({ error: '账号或密码错误' });
  }

  const userPayload = Buffer.from(JSON.stringify({ id: user.id, role: tokenRole })).toString('base64');
  const token = `mock-jwt-token-${userPayload}`;

  res.json({
    token,
    user: {
      ...user,
      role: tokenRole
    }
  });
});

router.get('/auth/me', authMiddleware.requireAuth.bind(authMiddleware), (req, res) => {
  res.json({
    user: req.user,
    dataScope: req.dataScope
  });
});

module.exports = router;
