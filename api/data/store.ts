import { createDataStore, type DataStore } from './mockData';
import type { FilterState, DataQualityStatus, RadarData } from '../../shared/types';

let store: DataStore = createDataStore();

export function getDataStore() {
  return store;
}

export function refreshData() {
  store = createDataStore();
  return store;
}

export function filterTrainingData(filters: FilterState, currentUserRole: string, currentUserId?: string) {
  let data = [...store.trainingData];
  
  if (currentUserRole === 'athlete' && currentUserId) {
    const user = store.users.find(u => u.id === currentUserId);
    if (user?.athleteId) {
      data = data.filter(d => d.athleteId === user.athleteId);
    }
  } else if (filters.athleteIds.length > 0) {
    data = data.filter(d => filters.athleteIds.includes(d.athleteId));
  }

  if (filters.dateRange.start && filters.dateRange.end) {
    data = data.filter(d => d.date >= filters.dateRange.start && d.date <= filters.dateRange.end);
  }

  return data;
}

export function filterRecoveryData(filters: FilterState, currentUserRole: string, currentUserId?: string) {
  let data = [...store.recoveryData];
  
  if (currentUserRole === 'athlete' && currentUserId) {
    const user = store.users.find(u => u.id === currentUserId);
    if (user?.athleteId) {
      data = data.filter(d => d.athleteId === user.athleteId);
    }
  } else if (filters.athleteIds.length > 0) {
    data = data.filter(d => filters.athleteIds.includes(d.athleteId));
  }

  if (filters.dateRange.start && filters.dateRange.end) {
    data = data.filter(d => d.date >= filters.dateRange.start && d.date <= filters.dateRange.end);
  }

  return data;
}

export function filterStrengthData(filters: FilterState, currentUserRole: string, currentUserId?: string) {
  let data = [...store.strengthData];
  
  if (currentUserRole === 'athlete' && currentUserId) {
    const user = store.users.find(u => u.id === currentUserId);
    if (user?.athleteId) {
      data = data.filter(d => d.athleteId === user.athleteId);
    }
  } else if (filters.athleteIds.length > 0) {
    data = data.filter(d => filters.athleteIds.includes(d.athleteId));
  }

  if (filters.dateRange.start && filters.dateRange.end) {
    data = data.filter(d => d.date >= filters.dateRange.start && d.date <= filters.dateRange.end);
  }

  if (filters.exercises.length > 0) {
    data = data.filter(d => filters.exercises.includes(d.exercise));
  }

  return data;
}

export function getInjuryRecords(filters: FilterState, currentUserRole: string, currentUserId?: string) {
  if (currentUserRole !== 'coach') {
    return [];
  }

  let data = [...store.injuryRecords];
  
  if (filters.athleteIds.length > 0) {
    data = data.filter(d => filters.athleteIds.includes(d.athleteId));
  }

  return data;
}

export function getRadarData(athleteId: string): RadarData {
  const training = store.trainingData.filter(d => d.athleteId === athleteId);
  const strength = store.strengthData.filter(d => d.athleteId === athleteId);
  const recovery = store.recoveryData.filter(d => d.athleteId === athleteId);

  const avgLoad = training.length > 0 ? training.reduce((sum, d) => sum + d.loadScore, 0) / training.length : 0;
  const avgStrength = strength.length > 0 ? strength.reduce((sum, d) => sum + (d.estimated1Rm || 0), 0) / strength.length : 0;
  const avgRecovery = recovery.length > 0 ? recovery.reduce((sum, d) => sum + d.overallScore, 0) / recovery.length : 0;
  const avgPace = training.filter(d => d.paceKmPerH).reduce((sum, d) => sum + (d.paceKmPerH || 0), 0) / (training.filter(d => d.paceKmPerH).length || 1);
  const avgDuration = training.length > 0 ? training.reduce((sum, d) => sum + d.durationMin, 0) / training.length : 0;
  const avgHr = training.filter(d => d.avgHeartRate).reduce((sum, d) => sum + (d.avgHeartRate || 0), 0) / (training.filter(d => d.avgHeartRate).length || 1);

  return {
    athleteId,
    metrics: [
      { name: '负荷量', value: Math.min(100, Math.round(avgLoad / 8)), max: 100 },
      { name: '力量水平', value: Math.min(100, Math.round(avgStrength / 1.5)), max: 100 },
      { name: '恢复能力', value: Math.round(avgRecovery), max: 100 },
      { name: '速度耐力', value: Math.min(100, Math.round(avgPace * 6)), max: 100 },
      { name: '训练时长', value: Math.min(100, Math.round(avgDuration / 1.2)), max: 100 },
      { name: '心率强度', value: Math.min(100, Math.round((avgHr - 60) / 1.2)), max: 100 },
    ],
    lastUpdated: new Date(),
  };
}

export function getDataQualityStatus(_filters: FilterState): DataQualityStatus {
  const training = store.trainingData.length;
  const recovery = store.recoveryData.length;
  const strength = store.strengthData.length;
  const injuries = store.injuryRecords.length;
  const athletes = store.athletes.length;

  const warnings: string[] = [];

  const trainingMissingHr = store.trainingData.filter(d => !d.avgHeartRate).length;
  if (trainingMissingHr > 0) warnings.push(`训练心率数据缺失 ${trainingMissingHr} 条`);

  const sampleSize = training + recovery + strength;
  if (sampleSize < 10) {
    warnings.push('样本量较小，分析结果可能存在偏差');
  }

  const hasErrors = training === 0;

  return {
    status: hasErrors ? 'error' : warnings.length > 0 ? 'warning' : 'healthy',
    lastUpdated: new Date(),
    warnings,
    sampleSizes: {
      training,
      strength,
      recovery,
      injuries,
      athletes,
    },
    etlStatus: 'completed',
  };
}

export function getAvailableSports() {
  return [...new Set(store.athletes.map(a => a.sport))];
}

export function getAvailableExercises() {
  return [...new Set(store.strengthData.map(d => d.exercise))];
}

export function getAthletes(sport?: string) {
  if (sport) {
    return store.athletes.filter(a => a.sport === sport);
  }
  return store.athletes;
}
