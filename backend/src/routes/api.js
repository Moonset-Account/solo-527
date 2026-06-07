const express = require('express');
const router = express.Router();
const mockData = require('../data/mockData');
const { metricsConfig, radarMetrics } = require('../data/metricsConfig');
const etlService = require('../services/etlService');
const cacheService = require('../services/cacheService');
const exportService = require('../services/exportService');
const authMiddleware = require('../middleware/auth');

const {
  athletes,
  coaches,
  sports,
  exercises,
  trainingPlans,
  actualTrainings,
  heartRateData,
  paceData,
  strengthTests,
  recoveryScores,
  injuryRecords
} = mockData;

const enforceScope = (req, queryField = 'athleteId') => {
  if (req.dataScope && req.dataScope.type === 'self') {
    return req.dataScope.athleteId;
  }
  return req.query[queryField];
};

router.get('/athletes', authMiddleware.enforceDataPermission.bind(authMiddleware), (req, res) => {
  const { sport } = req.query;
  let result = athletes;

  if (req.dataScope && req.dataScope.type === 'self') {
    result = athletes.filter(a => a.id === req.dataScope.athleteId);
  } else if (sport) {
    result = athletes.filter(a => a.sport === sport);
  }
  res.json(result);
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

router.get('/training/load-curve', authMiddleware.enforceDataPermission.bind(authMiddleware), (req, res) => {
  const effectiveAthleteId = enforceScope(req);

  const cacheKey = cacheService.generateKey('loadCurve', { ...req.query, effectiveAthleteId });
  const cached = cacheService.get(cacheKey);
  if (cached) return res.json(cached);

  const { sport, startDate, endDate, exercise, metric = 'load' } = req.query;

  let filtered = [...actualTrainings];

  if (effectiveAthleteId) filtered = filtered.filter(t => t.athleteId === effectiveAthleteId);
  if (sport) filtered = filtered.filter(t => t.sport === sport);
  if (exercise) filtered = filtered.filter(t => t.exercise === exercise);
  if (startDate) filtered = filtered.filter(t => t.date >= startDate);
  if (endDate) filtered = filtered.filter(t => t.date <= endDate);

  const chartData = etlService.transformTrainingForChart(filtered, 'date');
  const anomalies = etlService.detectAnomalies(chartData, 'load');

  const dataWithTrainingIds = chartData.map(d => {
    const dayTrainings = filtered.filter(t => t.date === d.key);
    return {
      ...d,
      trainingIds: dayTrainings.map(t => t.id),
      exerciseList: [...new Set(dayTrainings.map(t => t.exercise))]
    };
  });

  const result = {
    data: dataWithTrainingIds.sort((a, b) => a.key.localeCompare(b.key)),
    anomalies: anomalies.map(a => ({
      ...a,
      trainingIds: filtered.filter(t => t.date === a.key).map(t => t.id)
    })),
    summary: {
      totalLoad: chartData.reduce((s, d) => s + d.load, 0),
      avgIntensity: chartData.length > 0 ? Math.round(chartData.reduce((s, d) => s + d.intensity, 0) / chartData.length) : 0,
      avgCompletion: chartData.length > 0 ? Math.round(chartData.reduce((s, d) => s + d.completionRate, 0) / chartData.length) : 0
    },
    dataScope: req.dataScope
  };

  cacheService.set(cacheKey, result);
  res.json(result);
});

router.get('/training/radar', authMiddleware.enforceDataPermission.bind(authMiddleware), (req, res) => {
  let athleteId = enforceScope(req);

  if (!athleteId) {
    return res.status(400).json({ error: '请选择队员' });
  }

  const athlete = athletes.find(a => a.id === athleteId);
  if (!athlete) {
    return res.status(404).json({ error: '队员不存在' });
  }

  const athleteTrainings = actualTrainings.filter(t => t.athleteId === athleteId);
  const last30Days = athleteTrainings.slice(-50);
  const recovery = recoveryScores.filter(r => r.athleteId === athleteId).slice(-7);

  const avgRecovery = recovery.length > 0
    ? recovery.reduce((s, r) => s + r.overallScore, 0) / recovery.length
    : 60;

  const radarData = radarMetrics.map(m => {
    let value = 50 + Math.random() * 40;
    switch (m.key) {
      case 'strength':
        const st = strengthTests.filter(s => s.athleteId === athleteId);
        value = st.length > 0 ? Math.min(100, st.reduce((s, t) => s + t.oneRepMax, 0) / st.length / 2) : 60;
        break;
      case 'endurance':
        const enduranceTrainings = last30Days.filter(t => ['3000米跑', '400米跑'].includes(t.exercise));
        value = enduranceTrainings.length * 10 + 40;
        break;
      case 'speed':
        const speedTrainings = last30Days.filter(t => ['30米冲刺', '100米跑'].includes(t.exercise));
        value = speedTrainings.length * 12 + 35;
        break;
      case 'power':
        const powerTrainings = last30Days.filter(t => ['高翻', '深蹲'].includes(t.exercise));
        const avgIntensity = powerTrainings.length > 0
          ? powerTrainings.reduce((s, t) => s + t.actualIntensity, 0) / powerTrainings.length
          : 60;
        value = avgIntensity;
        break;
      case 'flexibility':
        value = 55 + Math.random() * 30;
        break;
      case 'recovery':
        value = avgRecovery;
        break;
    }
    return {
      metric: m.name,
      value: Math.min(100, Math.round(value)),
      max: m.max
    };
  });

  res.json({
    athlete: { id: athlete.id, name: athlete.name, sport: athlete.sport },
    radarData,
    teamAvg: radarMetrics.map(m => ({ metric: m.name, value: 65, max: m.max }))
  });
});

router.get('/recovery/trend', authMiddleware.enforceDataPermission.bind(authMiddleware), (req, res) => {
  const effectiveAthleteId = enforceScope(req);

  const cacheKey = cacheService.generateKey('recoveryTrend', { ...req.query, effectiveAthleteId });
  const cached = cacheService.get(cacheKey);
  if (cached) return res.json(cached);

  const { startDate, endDate } = req.query;

  let filtered = [...recoveryScores];
  if (effectiveAthleteId) filtered = filtered.filter(r => r.athleteId === effectiveAthleteId);
  if (startDate) filtered = filtered.filter(r => r.date >= startDate);
  if (endDate) filtered = filtered.filter(r => r.date <= endDate);

  filtered = filtered.sort((a, b) => a.date.localeCompare(b.date));

  const anomalies = etlService.detectAnomalies(filtered, 'overallScore');

  const result = {
    data: filtered,
    anomalies: anomalies.map(a => ({
      ...a,
      linkedTrainingDate: a.date
    })),
    summary: {
      avgOverall: filtered.length > 0 ? Math.round(filtered.reduce((s, r) => s + r.overallScore, 0) / filtered.length) : 0,
      avgSleep: filtered.length > 0 ? Math.round(filtered.reduce((s, r) => s + r.sleepScore, 0) / filtered.length) : 0,
      avgHRV: filtered.length > 0 ? Math.round(filtered.reduce((s, r) => s + r.hrv, 0) / filtered.length) : 0
    }
  };

  cacheService.set(cacheKey, result);
  res.json(result);
});

router.get('/training/comparison', authMiddleware.requireCoach.bind(authMiddleware), (req, res) => {
  const { athleteIds, metric = 'load', startDate, endDate } = req.query;
  const ids = Array.isArray(athleteIds) ? athleteIds : [athleteIds];

  if (!ids || ids.length === 0) {
    return res.json([]);
  }

  const comparisonData = ids.map(id => {
    let trainings = actualTrainings.filter(t => t.athleteId === id);
    if (startDate) trainings = trainings.filter(t => t.date >= startDate);
    if (endDate) trainings = trainings.filter(t => t.date <= endDate);

    const athlete = athletes.find(a => a.id === id);
    const daily = etlService.transformTrainingForChart(trainings, 'date');

    return {
      athleteId: id,
      athleteName: athlete ? athlete.name : id,
      sport: athlete ? athlete.sport : '',
      data: daily.sort((a, b) => a.key.localeCompare(b.key)),
      total: daily.reduce((s, d) => s + d[metric], 0),
      average: daily.length > 0 ? Math.round(daily.reduce((s, d) => s + d[metric], 0) / daily.length) : 0
    };
  });

  res.json(comparisonData);
});

router.get('/training/detail/:id', authMiddleware.enforceDataPermission.bind(authMiddleware), (req, res) => {
  const { id } = req.params;
  const training = actualTrainings.find(t => t.id === id);
  if (!training) {
    return res.status(404).json({ error: '训练记录不存在' });
  }

  if (req.dataScope && req.dataScope.type === 'self' && training.athleteId !== req.dataScope.athleteId) {
    return res.status(403).json({ error: '权限不足：只能查看自己的训练记录' });
  }

  const plan = trainingPlans.find(p => p.id === training.planId);
  const hrData = heartRateData.filter(
    h => h.athleteId === training.athleteId && h.date === training.date && h.exercise === training.exercise
  );

  const paceForExercise = paceData.find(
    p => p.athleteId === training.athleteId && p.date === training.date && p.exercise === training.exercise
  );

  const planIntensity = plan ? (plan.adjusted ? plan.adjustedIntensity : plan.plannedIntensity) : 0;
  const originalIntensity = plan ? (plan.originalIntensity || plan.plannedIntensity) : 0;
  const plannedLoad = plan ? plan.plannedSets * plan.plannedReps * planIntensity : 0;
  const originalPlannedLoad = plan ? plan.plannedSets * plan.plannedReps * originalIntensity : 0;
  const actualLoad = etlService.calculateLoad(training);

  const deviationAnalysis = plan ? {
    sets: {
      planned: plan.plannedSets,
      actual: training.actualSets,
      diff: training.actualSets - plan.plannedSets,
      deviationPercent: Math.round(((training.actualSets - plan.plannedSets) / plan.plannedSets) * 100)
    },
    reps: {
      planned: plan.plannedReps,
      actual: training.actualReps,
      diff: training.actualReps - plan.plannedReps,
      deviationPercent: Math.round(((training.actualReps - plan.plannedReps) / plan.plannedReps) * 100)
    },
    intensity: {
      originalPlanned: originalIntensity,
      adjustedPlanned: planIntensity,
      actual: training.actualIntensity,
      diffFromAdjusted: training.actualIntensity - planIntensity,
      diffFromOriginal: training.actualIntensity - originalIntensity,
      wasAdjusted: plan.adjusted
    },
    load: {
      planned: plannedLoad,
      originalPlannedLoad: originalPlannedLoad,
      actual: actualLoad,
      deviationPercent: Math.round(((actualLoad - plannedLoad) / plannedLoad) * 100)
    }
  } : null;

  res.json({
    training,
    plan,
    heartRate: hrData,
    pace: paceForExercise || null,
    planComparison: plan ? {
      sets: { planned: plan.plannedSets, actual: training.actualSets, diff: training.actualSets - plan.plannedSets },
      reps: { planned: plan.plannedReps, actual: training.actualReps, diff: training.actualReps - plan.plannedReps },
      intensity: {
        planned: plan.adjusted ? plan.adjustedIntensity : plan.plannedIntensity,
        actual: training.actualIntensity,
        original: plan.originalIntensity,
        wasAdjusted: plan.adjusted
      },
      adjusted: plan.adjusted,
      adjustmentReason: plan.adjustmentReason
    } : null,
    deviationAnalysis,
    rawRecord: {
      ...training,
      calculatedLoad: etlService.calculateLoad(training)
    }
  });
});

router.get('/injuries', authMiddleware.enforceDataPermission.bind(authMiddleware), (req, res) => {
  let athleteId = enforceScope(req);
  const userRole = req.user?.role;

  let filtered = [...injuryRecords];
  if (athleteId) filtered = filtered.filter(i => i.athleteId === athleteId);

  const canViewInternal = authMiddleware.canViewInternalNotes(userRole);
  if (!canViewInternal) {
    filtered = filtered.map(({ internalNotes, ...rest }) => rest);
  }

  res.json(filtered);
});

router.get('/training-plans', authMiddleware.enforceDataPermission.bind(authMiddleware), (req, res) => {
  let athleteId = enforceScope(req);
  const { date, adjustedOnly } = req.query;

  let filtered = [...trainingPlans];
  if (athleteId) filtered = filtered.filter(p => p.athleteId === athleteId);
  if (date) filtered = filtered.filter(p => p.date === date);
  if (adjustedOnly === 'true') filtered = filtered.filter(p => p.adjusted);

  const withActual = filtered.map(plan => {
    const actual = actualTrainings.find(t => t.planId === plan.id);
    const deviation = actual && plan ? {
      intensityDeviation: actual.actualIntensity - (plan.adjusted ? plan.adjustedIntensity : plan.plannedIntensity),
      originalIntensityDeviation: actual.actualIntensity - (plan.originalIntensity || plan.plannedIntensity),
      loadDeviation: actual ? etlService.calculateLoad(actual) - (plan.plannedSets * plan.plannedReps * (plan.adjusted ? plan.adjustedIntensity : plan.plannedIntensity)) : 0
    } : null;

    return {
      ...plan,
      actual: actual || null,
      deviation
    };
  });

  res.json(withActual.sort((a, b) => b.date.localeCompare(a.date)));
});

router.get('/acwr', authMiddleware.enforceDataPermission.bind(authMiddleware), (req, res) => {
  let athleteId = enforceScope(req);
  if (!athleteId) {
    return res.status(400).json({ error: '请指定队员' });
  }

  const { date } = req.query;
  const result = etlService.calculateAcuteChronicWorkloadRatio(
    athleteId,
    date || new Date().toISOString().split('T')[0]
  );
  res.json(result);
});

router.get('/training/day/:date', authMiddleware.enforceDataPermission.bind(authMiddleware), (req, res) => {
  const { date } = req.params;
  let athleteId = enforceScope(req);

  let trainings = actualTrainings.filter(t => t.date === date);
  if (athleteId) trainings = trainings.filter(t => t.athleteId === athleteId);

  const withPlans = trainings.map(t => ({
    training: t,
    plan: trainingPlans.find(p => p.id === t.planId),
    calculatedLoad: etlService.calculateLoad(t)
  }));

  res.json(withPlans);
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
    recovery: recoveryScores.filter(r =>
      r.athleteId === athleteId &&
      (!startDate || r.date >= startDate) &&
      (!endDate || r.date <= endDate)
    ),
    plans: trainingPlans.filter(p =>
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
