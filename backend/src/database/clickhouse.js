const mockData = require('../data/mockData');
const etlService = require('../services/etlService');

const {
  actualTrainings,
  trainingPlans,
  recoveryScores,
  injuryRecords,
  strengthTests,
  heartRateData,
  athletes,
  sports,
  exercises
} = mockData;

class ClickHouseClient {
  constructor() {
    this.queryLog = [];
    this.queryLatency = 5;
  }

  logQuery(sql, params = {}) {
    this.queryLog.push({
      timestamp: Date.now(),
      sql,
      params,
      executionTime: this.queryLatency + Math.random() * 10
    });
    if (this.queryLog.length > 100) {
      this.queryLog.shift();
    }
  }

  async query(sql, params = {}) {
    await this._simulateLatency();
    this.logQuery(sql, params);

    const sqlUpper = sql.toUpperCase().trim();

    if (sqlUpper.includes('SELECT') && sqlUpper.includes('TRAINING_SUMMARY')) {
      return this._queryTrainingSummary(params);
    }
    if (sqlUpper.includes('SELECT') && sqlUpper.includes('LOAD_CURVE')) {
      return this._queryLoadCurve(params);
    }
    if (sqlUpper.includes('SELECT') && sqlUpper.includes('RECOVERY_TREND')) {
      return this._queryRecoveryTrend(params);
    }
    if (sqlUpper.includes('SELECT') && sqlUpper.includes('TRAINING_COMPARISON')) {
      return this._queryTrainingComparison(params);
    }
    if (sqlUpper.includes('SELECT') && sqlUpper.includes('DAY_TRAININGS')) {
      return this._queryDayTrainings(params);
    }
    if (sqlUpper.includes('SELECT') && sqlUpper.includes('TRAINING_DETAIL')) {
      return this._queryTrainingDetail(params);
    }
    if (sqlUpper.includes('SELECT') && sqlUpper.includes('RADAR_METRICS')) {
      return this._queryRadarMetrics(params);
    }
    if (sqlUpper.includes('SELECT') && sqlUpper.includes('INJURY_RECORDS')) {
      return this._queryInjuryRecords(params);
    }
    if (sqlUpper.includes('SELECT') && sqlUpper.includes('TRAINING_PLANS')) {
      return this._queryTrainingPlans(params);
    }
    if (sqlUpper.includes('SELECT') && sqlUpper.includes('ACWR')) {
      return this._queryACWR(params);
    }

    throw new Error(`Unsupported query pattern: ${sql.substring(0, 100)}`);
  }

  async _simulateLatency() {
    return new Promise(resolve => setTimeout(resolve, this.queryLatency + Math.random() * 5));
  }

  _queryTrainingSummary(params) {
    const { athleteId, sport, startDate, endDate, exercise } = params;

    let filtered = [...actualTrainings];
    if (athleteId) filtered = filtered.filter(t => t.athleteId === athleteId);
    if (sport) filtered = filtered.filter(t => t.sport === sport);
    if (exercise) filtered = filtered.filter(t => t.exercise === exercise);
    if (startDate) filtered = filtered.filter(t => t.date >= startDate);
    if (endDate) filtered = filtered.filter(t => t.date <= endDate);

    const totalLoad = filtered.reduce((sum, t) => sum + etlService.calculateLoad(t), 0);
    const avgIntensity = filtered.length > 0
      ? Math.round(filtered.reduce((s, t) => s + t.actualIntensity, 0) / filtered.length)
      : 0;
    const avgCompletion = filtered.length > 0
      ? Math.round(filtered.reduce((s, t) => s + (t.completionRate || 0), 0) / filtered.length)
      : 0;

    return {
      rows: [{
        total_records: filtered.length,
        total_load: totalLoad,
        avg_intensity: avgIntensity,
        avg_completion: avgCompletion,
        query_source: 'clickhouse_mergetree',
        scan_rows: actualTrainings.length
      }]
    };
  }

  _queryLoadCurve(params) {
    const { athleteId, sport, startDate, endDate, exercise } = params;

    let filtered = [...actualTrainings];
    if (athleteId) filtered = filtered.filter(t => t.athleteId === athleteId);
    if (sport) filtered = filtered.filter(t => t.sport === sport);
    if (exercise) filtered = filtered.filter(t => t.exercise === exercise);
    if (startDate) filtered = filtered.filter(t => t.date >= startDate);
    if (endDate) filtered = filtered.filter(t => t.date <= endDate);

    const chartData = etlService.transformTrainingForChart(filtered, 'date');
    const anomalies = etlService.detectAnomalies(chartData, 'load');

    const dataWithIds = chartData.map(d => {
      const dayTrainings = filtered.filter(t => t.date === d.key);
      return {
        ...d,
        training_ids: dayTrainings.map(t => t.id),
        exercise_list: [...new Set(dayTrainings.map(t => t.exercise))]
      };
    });

    const summary = this._queryTrainingSummary(params).rows[0];

    return {
      rows: dataWithIds.sort((a, b) => a.key.localeCompare(b.key)),
      anomalies: anomalies.map(a => ({
        ...a,
        training_ids: filtered.filter(t => t.date === a.key).map(t => t.id)
      })),
      summary,
      queryMeta: {
        engine: 'MergeTree',
        processed_parts: 24,
        elapsed: (this.queryLatency + Math.random() * 5).toFixed(2) + 'ms'
      }
    };
  }

  _queryRecoveryTrend(params) {
    const { athleteId, startDate, endDate } = params;

    let filtered = [...recoveryScores];
    if (athleteId) filtered = filtered.filter(r => r.athleteId === athleteId);
    if (startDate) filtered = filtered.filter(r => r.date >= startDate);
    if (endDate) filtered = filtered.filter(r => r.date <= endDate);

    filtered = filtered.sort((a, b) => a.date.localeCompare(b.date));
    const anomalies = etlService.detectAnomalies(filtered, 'overallScore');

    return {
      rows: filtered,
      anomalies: anomalies.map(a => ({
        ...a,
        linked_training_date: a.date
      })),
      summary: {
        avg_overall: filtered.length > 0 ? Math.round(filtered.reduce((s, r) => s + r.overallScore, 0) / filtered.length) : 0,
        avg_sleep: filtered.length > 0 ? Math.round(filtered.reduce((s, r) => s + r.sleepScore, 0) / filtered.length) : 0,
        avg_hrv: filtered.length > 0 ? Math.round(filtered.reduce((s, r) => s + r.hrv, 0) / filtered.length) : 0
      },
      queryMeta: {
        engine: 'MergeTree',
        processed_parts: 12,
        elapsed: (this.queryLatency + Math.random() * 3).toFixed(2) + 'ms'
      }
    };
  }

  _queryTrainingComparison(params) {
    const { athleteIds, metric = 'load', startDate, endDate } = params;
    const ids = Array.isArray(athleteIds) ? athleteIds : [athleteIds];

    const comparisonData = ids.map(id => {
      let trainings = actualTrainings.filter(t => t.athleteId === id);
      if (startDate) trainings = trainings.filter(t => t.date >= startDate);
      if (endDate) trainings = trainings.filter(t => t.date <= endDate);

      const athlete = athletes.find(a => a.id === id);
      const daily = etlService.transformTrainingForChart(trainings, 'date');

      return {
        athlete_id: id,
        athlete_name: athlete ? athlete.name : id,
        sport: athlete ? athlete.sport : '',
        data: daily.sort((a, b) => a.key.localeCompare(b.key)),
        total: daily.reduce((s, d) => s + d[metric], 0),
        average: daily.length > 0 ? Math.round(daily.reduce((s, d) => s + d[metric], 0) / daily.length) : 0
      };
    });

    return {
      rows: comparisonData,
      queryMeta: {
        engine: 'MergeTree',
        processed_athletes: ids.length,
        elapsed: (this.queryLatency + Math.random() * 8).toFixed(2) + 'ms'
      }
    };
  }

  _queryDayTrainings(params) {
    const { date, athleteId } = params;

    let trainings = actualTrainings.filter(t => t.date === date);
    if (athleteId) trainings = trainings.filter(t => t.athleteId === athleteId);

    const withDetails = trainings.map(t => {
      const plan = trainingPlans.find(p => p.id === t.planId);
      const planIntensity = plan ? (plan.adjusted ? plan.adjustedIntensity : plan.plannedIntensity) : 0;
      const originalIntensity = plan ? (plan.originalIntensity || plan.plannedIntensity) : 0;
      const plannedLoad = plan ? plan.plannedSets * plan.plannedReps * planIntensity : 0;

      return {
        training: t,
        plan: plan || null,
        calculatedLoad: etlService.calculateLoad(t),
        deviation: plan ? {
          intensityDeviation: t.actualIntensity - planIntensity,
          originalIntensityDeviation: t.actualIntensity - originalIntensity,
          loadDeviation: etlService.calculateLoad(t) - plannedLoad,
          setsDeviation: plan ? t.actualSets - plan.plannedSets : 0,
          repsDeviation: plan ? t.actualReps - plan.plannedReps : 0
        } : null,
        planComparison: plan ? {
          sets: { planned: plan.plannedSets, actual: t.actualSets, diff: t.actualSets - plan.plannedSets },
          reps: { planned: plan.plannedReps, actual: t.actualReps, diff: t.actualReps - plan.plannedReps },
          intensity: {
            planned: planIntensity,
            actual: t.actualIntensity,
            original: plan.originalIntensity || null,
            wasAdjusted: plan.adjusted
          }
        } : null
      };
    });

    return {
      rows: withDetails,
      hasAdjusted: withDetails.some(t => t.plan?.adjusted),
      queryMeta: {
        engine: 'MergeTree',
        elapsed: (this.queryLatency + Math.random() * 3).toFixed(2) + 'ms'
      }
    };
  }

  _queryTrainingDetail(params) {
    const { id } = params;
    const training = actualTrainings.find(t => t.id === id);

    if (!training) {
      return { rows: [], found: false };
    }

    const plan = trainingPlans.find(p => p.id === training.planId);
    const hrData = heartRateData.filter(
      h => h.athleteId === training.athleteId && h.date === training.date && h.exercise === training.exercise
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
        deviation_percent: Math.round(((training.actualSets - plan.plannedSets) / plan.plannedSets) * 100)
      },
      reps: {
        planned: plan.plannedReps,
        actual: training.actualReps,
        diff: training.actualReps - plan.plannedReps,
        deviation_percent: Math.round(((training.actualReps - plan.plannedReps) / plan.plannedReps) * 100)
      },
      intensity: {
        original_planned: originalIntensity,
        adjusted_planned: planIntensity,
        actual: training.actualIntensity,
        diff_from_adjusted: training.actualIntensity - planIntensity,
        diff_from_original: training.actualIntensity - originalIntensity,
        was_adjusted: plan.adjusted,
        adjustment_reason: plan.adjustmentReason || null
      },
      load: {
        planned: plannedLoad,
        original_planned_load: originalPlannedLoad,
        actual: actualLoad,
        deviation_percent: plannedLoad > 0 ? Math.round(((actualLoad - plannedLoad) / plannedLoad) * 100) : 0
      }
    } : null;

    return {
      rows: [{
        training,
        plan,
        heart_rate: hrData,
        planComparison: plan ? {
          sets: { planned: plan.plannedSets, actual: training.actualSets, diff: training.actualSets - plan.plannedSets },
          reps: { planned: plan.plannedReps, actual: training.actualReps, diff: training.actualReps - plan.plannedReps },
          intensity: {
            planned: planIntensity,
            actual: training.actualIntensity,
            original: plan.originalIntensity || null,
            was_adjusted: plan.adjusted
          },
          adjusted: plan.adjusted,
          adjustment_reason: plan.adjustmentReason || null
        } : null,
        deviation_analysis: deviationAnalysis,
        raw_record: {
          ...training,
          calculatedLoad: actualLoad,
          plan_intensity: planIntensity,
          original_intensity: originalIntensity
        }
      }],
      found: true,
      queryMeta: {
        engine: 'MergeTree',
        elapsed: (this.queryLatency + Math.random() * 4).toFixed(2) + 'ms'
      }
    };
  }

  _queryRadarMetrics(params) {
    const { athleteId } = params;
    const athlete = athletes.find(a => a.id === athleteId);

    if (!athlete) {
      return { rows: [], found: false };
    }

    const athleteTrainings = actualTrainings.filter(t => t.athleteId === athleteId);
    const last30Days = athleteTrainings.slice(-50);
    const recovery = recoveryScores.filter(r => r.athleteId === athleteId).slice(-7);
    const avgRecovery = recovery.length > 0
      ? recovery.reduce((s, r) => s + r.overallScore, 0) / recovery.length
      : 60;

    const radarMetrics = require('../data/metricsConfig').radarMetrics;

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

    return {
      rows: [{
        athlete: { id: athlete.id, name: athlete.name, sport: athlete.sport },
        radar_data: radarData,
        team_avg: radarMetrics.map(m => ({ metric: m.name, value: 65, max: m.max }))
      }],
      found: true
    };
  }

  _queryInjuryRecords(params) {
    const { athleteId } = params;

    let filtered = [...injuryRecords];
    if (athleteId) filtered = filtered.filter(i => i.athleteId === athleteId);

    return {
      rows: filtered,
      has_internal_notes: filtered.some(r => r.internalNotes),
      queryMeta: {
        engine: 'MergeTree',
        elapsed: (this.queryLatency + Math.random() * 2).toFixed(2) + 'ms'
      }
    };
  }

  _queryTrainingPlans(params) {
    const { athleteId, date, adjustedOnly } = params;

    let filtered = [...trainingPlans];
    if (athleteId) filtered = filtered.filter(p => p.athleteId === athleteId);
    if (date) filtered = filtered.filter(p => p.date === date);
    if (adjustedOnly === true || adjustedOnly === 'true') {
      filtered = filtered.filter(p => p.adjusted);
    }

    const withDetails = filtered.map(plan => {
      const actual = actualTrainings.find(t => t.planId === plan.id);
      const planIntensity = plan.adjusted ? plan.adjustedIntensity : plan.plannedIntensity;
      const originalIntensity = plan.originalIntensity || plan.plannedIntensity;
      const plannedLoad = plan.plannedSets * plan.plannedReps * planIntensity;

      const deviation = actual ? {
        intensityDeviation: actual.actualIntensity - planIntensity,
        originalIntensityDeviation: actual.actualIntensity - originalIntensity,
        loadDeviation: etlService.calculateLoad(actual) - plannedLoad,
        setsDeviation: actual.actualSets - plan.plannedSets,
        repsDeviation: actual.actualReps - plan.plannedReps,
        completionDeviation: (actual.completionRate || 0) - 100
      } : null;

      return {
        ...plan,
        actual: actual || null,
        deviation,
        calculatedMetrics: {
          plannedLoad: plannedLoad,
          actualLoad: actual ? etlService.calculateLoad(actual) : null,
          loadDeviationPercent: actual && plannedLoad > 0
            ? Math.round(((etlService.calculateLoad(actual) - plannedLoad) / plannedLoad) * 100)
            : null
        }
      };
    });

    return {
      rows: withDetails.sort((a, b) => b.date.localeCompare(a.date)),
      adjusted_count: withDetails.filter(p => p.adjusted).length,
      queryMeta: {
        engine: 'MergeTree',
        elapsed: (this.queryLatency + Math.random() * 3).toFixed(2) + 'ms'
      }
    };
  }

  _queryACWR(params) {
    const { athleteId, date } = params;
    const result = etlService.calculateAcuteChronicWorkloadRatio(
      athleteId,
      date || new Date().toISOString().split('T')[0]
    );

    return {
      rows: [{
        ...result,
        athlete_id: athleteId,
        calculated_at: date || new Date().toISOString().split('T')[0]
      }]
    };
  }

  getQueryStats() {
    return {
      total_queries: this.queryLog.length,
      recent_queries: this.queryLog.slice(-10),
      avg_latency: this.queryLog.length > 0
        ? (this.queryLog.reduce((s, q) => s + q.executionTime, 0) / this.queryLog.length).toFixed(2) + 'ms'
        : '0ms'
    };
  }
}

module.exports = new ClickHouseClient();
