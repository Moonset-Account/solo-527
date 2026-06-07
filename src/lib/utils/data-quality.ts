import { mean, std, quantile } from './statistics';

export interface MissingValueReport {
  totalRecords: number;
  fields: Record<string, {
    missingCount: number;
    missingRate: number;
    sampleValues: unknown[];
  }>;
  overallMissingRate: number;
}

export interface OutlierDetectionResult {
  field: string;
  outliers: Array<{
    index: number;
    value: number;
    method: 'iqr' | 'zscore';
    threshold: { lower: number; upper: number };
  }>;
  stats: {
    mean: number;
    std: number;
    q1: number;
    q3: number;
    iqr: number;
    lowerBound: number;
    upperBound: number;
  };
}

export function detectMissingValues<T extends Record<string, unknown>>(
  data: T[],
  fields: (keyof T)[]
): MissingValueReport {
  const totalRecords = data.length;
  const fieldsReport: MissingValueReport['fields'] = {};

  for (const field of fields) {
    let missingCount = 0;
    const sampleValues: unknown[] = [];

    for (const record of data) {
      const value = record[field];
      if (value === null || value === undefined || value === '') {
        missingCount++;
      } else if (sampleValues.length < 5) {
        sampleValues.push(value);
      }
    }

    fieldsReport[field as string] = {
      missingCount,
      missingRate: totalRecords > 0 ? missingCount / totalRecords : 0,
      sampleValues,
    };
  }

  const totalMissing = Object.values(fieldsReport).reduce(
    (sum, f) => sum + f.missingCount,
    0
  );
  const totalPossible = totalRecords * fields.length;
  const overallMissingRate = totalPossible > 0 ? totalMissing / totalPossible : 0;

  return {
    totalRecords,
    fields: fieldsReport,
    overallMissingRate,
  };
}

export function detectOutliers(
  values: number[],
  field: string,
  method: 'iqr' | 'zscore' | 'both' = 'both',
  zThreshold = 3
): OutlierDetectionResult {
  const validValues = values.filter((v) => v != null && !isNaN(v));
  
  if (validValues.length === 0) {
    return {
      field,
      outliers: [],
      stats: {
        mean: 0,
        std: 0,
        q1: 0,
        q3: 0,
        iqr: 0,
        lowerBound: 0,
        upperBound: 0,
      },
    };
  }

  const meanVal = mean(validValues);
  const stdVal = std(validValues);
  const q1 = quantile(validValues, 0.25);
  const q3 = quantile(validValues, 0.75);
  const iqr = q3 - q1;

  const iqrLower = q1 - 1.5 * iqr;
  const iqrUpper = q3 + 1.5 * iqr;
  const zLower = meanVal - zThreshold * stdVal;
  const zUpper = meanVal + zThreshold * stdVal;

  const outliers: OutlierDetectionResult['outliers'] = [];

  values.forEach((value, index) => {
    if (value == null || isNaN(value)) return;

    const isIqrOutlier = value < iqrLower || value > iqrUpper;
    const isZOutlier = value < zLower || value > zUpper;

    if (method === 'iqr' && isIqrOutlier) {
      outliers.push({
        index,
        value,
        method: 'iqr',
        threshold: { lower: iqrLower, upper: iqrUpper },
      });
    } else if (method === 'zscore' && isZOutlier) {
      outliers.push({
        index,
        value,
        method: 'zscore',
        threshold: { lower: zLower, upper: zUpper },
      });
    } else if (method === 'both' && (isIqrOutlier || isZOutlier)) {
      outliers.push({
        index,
        value,
        method: isIqrOutlier ? 'iqr' : 'zscore',
        threshold: isIqrOutlier
          ? { lower: iqrLower, upper: iqrUpper }
          : { lower: zLower, upper: zUpper },
      });
    }
  });

  return {
    field,
    outliers,
    stats: {
      mean: meanVal,
      std: stdVal,
      q1,
      q3,
      iqr,
      lowerBound: Math.min(iqrLower, zLower),
      upperBound: Math.max(iqrUpper, zUpper),
    },
  };
}

export function handleMissingValues(
  data: Record<string, unknown>[],
  strategy: 'remove' | 'mean' | 'median' | 'mode' | 'default' = 'remove',
  numericFields: string[] = [],
  defaultValue?: unknown
): Record<string, unknown>[] {
  if (strategy === 'remove') {
    return data.filter((record) =>
      Object.values(record).every((v) => v !== null && v !== undefined && v !== '')
    );
  }

  return data.map((record) => {
    const newRecord = { ...record };
    for (const field of numericFields) {
      const value = record[field];
      if (value === null || value === undefined || value === '') {
        if (strategy === 'default' && defaultValue !== undefined) {
          newRecord[field] = defaultValue;
        } else if (strategy === 'mean' || strategy === 'median') {
          const values = data
            .map((r) => r[field])
            .filter((v): v is number => typeof v === 'number' && !isNaN(v));
          if (values.length > 0) {
            const fillValue =
              strategy === 'mean'
                ? values.reduce((a, b) => a + b, 0) / values.length
                : [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
            newRecord[field] = fillValue;
          }
        }
      }
    }
    return newRecord;
  });
}

export interface DataQualitySummary {
  totalRecords: number;
  validRecords: number;
  missingValues: MissingValueReport;
  outliers: OutlierDetectionResult[];
  warnings: string[];
  dataFreshness?: Date;
}

export function generateDataQualityReport(
  data: Record<string, unknown>[],
  numericFields: string[],
  categoricalFields: string[]
): DataQualitySummary {
  const missingReport = detectMissingValues(data, [
    ...numericFields,
    ...categoricalFields,
  ]);

  const outlierResults: OutlierDetectionResult[] = [];
  for (const field of numericFields) {
    const values = data.map((d) => d[field]).filter((v): v is number => typeof v === 'number');
    outlierResults.push(detectOutliers(values, field));
  }

  const warnings: string[] = [];
  if (missingReport.overallMissingRate > 0.1) {
    warnings.push(`整体缺失率较高: ${(missingReport.overallMissingRate * 100).toFixed(1)}%`);
  }
  for (const [field, info] of Object.entries(missingReport.fields)) {
    if (info.missingRate > 0.2) {
      warnings.push(`字段 ${field} 缺失率超过 20%: ${(info.missingRate * 100).toFixed(1)}%`);
    }
  }
  for (const result of outlierResults) {
    const outlierRate = data.length > 0 ? result.outliers.length / data.length : 0;
    if (outlierRate > 0.1) {
      warnings.push(`字段 ${result.field} 异常值比例较高: ${(outlierRate * 100).toFixed(1)}%`);
    }
  }

  const validRecords = data.filter((record) =>
    Object.values(record).every((v) => v !== null && v !== undefined && v !== '')
  ).length;

  return {
    totalRecords: data.length,
    validRecords,
    missingValues: missingReport,
    outliers: outlierResults,
    warnings,
    dataFreshness: new Date(),
  };
}
