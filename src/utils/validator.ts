import { LearningActivity, ValidationResult } from '../data/types';
import { ANOMALY_SIGMA } from '../data/constants';

export const detectMissingValues = (activities: LearningActivity[]): { count: number; details: string[] } => {
  const details: string[] = [];
  let count = 0;
  
  activities.forEach((act) => {
    if (act.completedAt === null) {
      count++;
    }
    if (act.firstCompletedAt === null && act.completedAt !== null) {
      count++;
      details.push(`Activity ${act.id} missing firstCompletedAt`);
    }
  });
  
  return { count, details: details.slice(0, 10) };
};

export const detectAnomalies = (values: number[]): { anomalies: number[]; threshold: { lower: number; upper: number } } => {
  if (values.length < 2) {
    return { anomalies: [], threshold: { lower: 0, upper: 1 } };
  }
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);
  
  const lower = mean - ANOMALY_SIGMA * std;
  const upper = mean + ANOMALY_SIGMA * std;
  
  const anomalies = values.filter((v) => v < lower || v > upper);
  
  return { anomalies, threshold: { lower, upper } };
};

export const validateData = (activities: LearningActivity[]): ValidationResult => {
  const warnings: string[] = [];
  const missing = detectMissingValues(activities);
  
  const completionRates = activities.filter((a) => a.completedAt !== null).length / activities.length;
  const isLowSample = activities.length < 30;
  
  if (missing.count > 0) {
    warnings.push(`发现 ${missing.count} 条缺失值数据`);
  }
  
  if (isLowSample) {
    warnings.push(`样本量较小 (${activities.length})，结论仅供参考`);
  }
  
  if (completionRates < 0.3) {
    warnings.push(`整体完成率较低 (${(completionRates * 100).toFixed(1)}%)`);
  }
  
  return {
    hasMissingValues: missing.count > 0,
    missingCount: missing.count,
    hasAnomalies: false,
    anomalyCount: 0,
    sampleSize: activities.length,
    warnings,
  };
};
