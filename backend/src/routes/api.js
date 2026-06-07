const express = require('express');
const router = express.Router();
const mockData = require('../data/mockData');
const { metricsConfig, radarMetrics } = require('../data/metricsConfig');
const etlService = require('../services/etlService');
const cacheService = require('../services/cacheService');
const exportService = require('../services/exportService');

const {
  athletes,
  coaches,
  sports,
  exercises,
  trainingPlans,
  actualTrainings,
  heartRateData,
  strengthTests,
  recoveryScores,
  injuryRecords
} = mockData;

router.get('/athletes', (req, res) => {
  const { sport } = req.query;
  let result = athletes;
  if (sport) {
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

router.get('/training/load-curve', (req, res) => {
  const cacheKey = cacheService.generateKey('loadCurve', req.query);
  const cached = cacheService.get(cacheKey);
  if (cached) return res.json(cached);

  const { athleteId, sport, startDate, endDate, exercise, metric = 'load' } = req.query;

  let filtered = [...actualTrainings];

  if (athleteId) filtered = filtered.filter(t => t.athleteId === athleteId);
  if (sport) filtered = filtered.filter(t => t.sport === sport);
  if (exercise) filtered = filtered.filter(t => t.exercise === exercise);
  if (startDate) filtered = filtered.filter(t => t.date >= startDate);
  if (endDate) filtered = filtered.filter(t => t.date <= endDate);

  const chartData = etlService.transformTrainingForChart(filtered, 'date');

  const anomalies = etlService.detectAnomalies(chartData, 'load');

  const result = {
    data: chartData.sort((a, b) => a.key.localeCompare(b.key)),
    anomalies,
    summary: {
      totalLoad: chartData.reduce((s, d) => s + d.load, 0),
      avgIntensity: chartData.length > 0 ? Math.round(chartData.reduce((s, d) => s + d.intensity, 0) / chartData.length) : 0,
      avgCompletion: chartData.length > 0 ? Math.round(chartData.reduce((s, d) => s + d.completionRate, 0) / chartData.length) : 0
    }
  };

  cacheService.set(cacheKey, result);
  res.json(result);
});

router.get('/training/radar', (req, res) => {
  const { athleteId } = req.query;
  const athlete = athletes.find(a => a.id === athleteId);

  if (!athlete) {
    return res.status(404).json({ error: 'Athlete not found' });
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

router.get('/recovery/trend', (req, res) => {
  const cacheKey = cacheService.generateKey('recoveryTrend', req.query);
  const cached = cacheService.get(cacheKey);
  if (cached) return res.json(cached);

  const { athleteId, startDate, endDate } = req.query;

  let filtered = [...recoveryScores];
  if (athleteId) filtered = filtered.filter(r => r.athleteId === athleteId);
  if (startDate) filtered = filtered.filter(r => r.date >= startDate);
  if (endDate) filtered = filtered.filter(r => r.date <= endDate);

  filtered = filtered.sort((a, b) => a.date.localeCompare(b.date));

  const anomalies = etlService.detectAnomalies(filtered, 'overallScore');

  const result = {
    data: filtered,
    anomalies,
    summary: {
      avgOverall: filtered.length > 0 ? Math.round(filtered.reduce((s, r) => s + r.overallScore, 0) / filtered.length) : 0,
      avgSleep: filtered.length > 0 ? Math.round(filtered.reduce((s, r) => s + r.sleepScore, 0) / filtered.length) : 0,
      avgHRV: filtered.length > 0 ? Math.round(filtered.reduce((s, r) => s + r.hrv, 0) / filtered.length) : 0
    }
  };

  cacheService.set(cacheKey, result);
  res.json(result);
});

router.get('/training/comparison', (req, res) => {
  const { athleteIds, metric = 'load', startDate, endDate } = req.query;
  const ids = Array.isArray(athleteIds) ? athleteIds : [athleteIds];

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

router.get('/training/detail/:id', (req, res) => {
  const { id } = req.params;
  const training = actualTrainings.find(t => t.id === id);
  if (!training) {
    return res.status(404).json({ error: 'Training record not found' });
  }

  const plan = trainingPlans.find(p => p.id === training.planId);
  const hrData = heartRateData.filter(
    h => h.athleteId === training.athleteId && h.date === training.date && h.exercise === training.exercise
  );

  res.json({
    training,
    plan,
    heartRate: hrData,
    planComparison: plan ? {
      sets: { planned: plan.plannedSets, actual: training.actualSets, diff: training.actualSets - plan.plannedSets },
      reps: { planned: plan.plannedReps, actual: training.actualReps, diff: training.actualReps - plan.plannedReps },
      intensity: { planned: plan.adjusted ? plan.adjustedIntensity : plan.plannedIntensity, actual: training.actualIntensity, original: plan.originalIntensity },
      adjusted: plan.adjusted,
      adjustmentReason: plan.adjustmentReason
    } : null
  });
});

router.get('/injuries', (req, res) => {
  const { athleteId, role = 'coach' } = req.query;

  let filtered = [...injuryRecords];
  if (athleteId) filtered = filtered.filter(i => i.athleteId === athleteId);

  if (role !== 'coach' && role !== 'rehab') {
    filtered = filtered.map(({ internalNotes, ...rest }) => rest);
  }

  res.json(filtered);
});

router.get('/training-plans', (req, res) => {
  const { athleteId, date, adjustedOnly } = req.query;

  let filtered = [...trainingPlans];
  if (athleteId) filtered = filtered.filter(p => p.athleteId === athleteId);
  if (date) filtered = filtered.filter(p => p.date === date);
  if (adjustedOnly === 'true') filtered = filtered.filter(p => p.adjusted);

  const withActual = filtered.map(plan => {
    const actual = actualTrainings.find(t => t.planId === plan.id);
    return {
      ...plan,
      actual: actual || null
    };
  });

  res.json(withActual);
});

router.get('/acwr', (req, res) => {
  const { athleteId, date } = req.query;
  const result = etlService.calculateAcuteChronicWorkloadRatio(
    athleteId,
    date || new Date().toISOString().split('T')[0]
  );
  res.json(result);
});

router.get('/export/training', async (req, res) => {
  const { athleteId, startDate, endDate, format = 'xlsx' } = req.query;

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
    )
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
  if (role === 'coach') {
    user = coaches.find(c => c.id === username);
  } else {
    user = athletes.find(a => a.id === username);
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({
    token: 'mock-jwt-token-' + Date.now(),
    user: {
      ...user,
      role: role || 'athlete'
    }
  });
});

module.exports = router;
