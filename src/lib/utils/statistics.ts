export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function mode(values: number[]): number[] {
  if (values.length === 0) return [];
  const frequency: Record<number, number> = {};
  let maxFreq = 0;

  for (const v of values) {
    frequency[v] = (frequency[v] || 0) + 1;
    maxFreq = Math.max(maxFreq, frequency[v]);
  }

  return Object.entries(frequency)
    .filter(([, freq]) => freq === maxFreq)
    .map(([v]) => Number(v));
}

export function variance(values: number[]): number {
  if (values.length <= 1) return 0;
  const m = mean(values);
  const squaredDiffs = values.map((v) => Math.pow(v - m, 2));
  return mean(squaredDiffs);
}

export function std(values: number[]): number {
  return Math.sqrt(variance(values));
}

export function quantile(values: number[], q: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * q;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  
  if (lowerIndex === upperIndex) {
    return sorted[lowerIndex];
  }
  
  const weight = position - lowerIndex;
  return sorted[lowerIndex] * (1 - weight) + sorted[upperIndex] * weight;
}

export function min(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.min(...values);
}

export function max(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values);
}

export function sum(values: number[]): number {
  return values.reduce((s, v) => s + v, 0);
}

export function count<T>(values: T[], predicate: (v: T) => boolean): number {
  return values.filter(predicate).length;
}

export function frequency<T>(values: T[]): Map<T, number> {
  const map = new Map<T, number>();
  for (const v of values) {
    map.set(v, (map.get(v) || 0) + 1);
  }
  return map;
}

export interface BoxPlotStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  iqr: number;
  lowerFence: number;
  upperFence: number;
  outliers: number[];
}

export function boxPlotStats(values: number[]): BoxPlotStats {
  if (values.length === 0) {
    return {
      min: 0,
      q1: 0,
      median: 0,
      q3: 0,
      max: 0,
      iqr: 0,
      lowerFence: 0,
      upperFence: 0,
      outliers: [],
    };
  }

  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;

  const sorted = [...values].sort((a, b) => a - b);
  const nonOutliers = sorted.filter((v) => v >= lowerFence && v <= upperFence);
  const outliers = sorted.filter((v) => v < lowerFence || v > upperFence);

  return {
    min: nonOutliers.length > 0 ? nonOutliers[0] : sorted[0],
    q1,
    median: median(values),
    q3,
    max: nonOutliers.length > 0 ? nonOutliers[nonOutliers.length - 1] : sorted[sorted.length - 1],
    iqr,
    lowerFence,
    upperFence,
    outliers,
  };
}

export function correlation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;

  const n = x.length;
  const meanX = mean(x);
  const meanY = mean(y);

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);
  return denominator === 0 ? 0 : numerator / denominator;
}

export function normalize(values: number[]): number[] {
  if (values.length === 0) return [];
  const minVal = min(values);
  const maxVal = max(values);
  const range = maxVal - minVal;
  if (range === 0) return values.map(() => 0);
  return values.map((v) => (v - minVal) / range);
}

export function standardize(values: number[]): number[] {
  if (values.length === 0) return [];
  const m = mean(values);
  const s = std(values);
  if (s === 0) return values.map(() => 0);
  return values.map((v) => (v - m) / s);
}
