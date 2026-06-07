export interface CleanOptions {
  removeDuplicates?: boolean;
  fillMissingValues?: boolean;
  detectOutliers?: boolean;
  outlierThreshold?: number;
}

export interface CleanResult<T> {
  data: T[];
  removedCount: number;
  filledCount: number;
  outlierCount: number;
  missingRate: number;
}

export function cleanDataset<T extends Record<string, any>>(
  data: T[],
  options: CleanOptions = {}
): CleanResult<T> {
  const {
    removeDuplicates = true,
    fillMissingValues = true,
    detectOutliers = true,
    outlierThreshold = 3
  } = options;

  let cleaned = [...data];
  let removedCount = 0;
  let filledCount = 0;
  let outlierCount = 0;
  let totalMissing = 0;
  const totalFields = data.length * Object.keys(data[0] || {}).length;

  if (removeDuplicates) {
    const seen = new Set<string>();
    const before = cleaned.length;
    cleaned = cleaned.filter(item => {
      const key = JSON.stringify(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    removedCount = before - cleaned.length;
  }

  cleaned = cleaned.map(item => {
    const filled = { ...item } as Record<string, any>;
    Object.keys(filled).forEach(key => {
      const value = filled[key];
      if (value === null || value === undefined || value === '') {
        totalMissing++;
        if (fillMissingValues) {
          if (typeof value === 'number') {
            filled[key] = 0;
          } else {
            filled[key] = '未知';
          }
          filledCount++;
        }
      }
    });
    return filled as T;
  });

  if (detectOutliers) {
    const numericFields = Object.keys(cleaned[0] || {}).filter(
      k => typeof cleaned[0]?.[k] === 'number'
    );

    numericFields.forEach(field => {
      const values = cleaned.map(d => d[field] as number).filter(v => !isNaN(v));
      if (values.length < 3) return;
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
      cleaned.forEach(item => {
        const v = item[field] as number;
        if (!isNaN(v) && Math.abs(v - mean) > outlierThreshold * std) {
          (item as any)._isOutlier = true;
          (item as any)._outlierField = field;
          outlierCount++;
        }
      });
    });
  }

  return {
    data: cleaned,
    removedCount,
    filledCount,
    outlierCount,
    missingRate: totalFields > 0 ? (totalMissing / totalFields) * 100 : 0
  };
}

export function formatNumber(num: number, decimals: number = 0): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(decimals + 1) + '万';
  }
  return num.toFixed(decimals);
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function generateCSV(data: Record<string, any>[], filename: string): void {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h];
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val}"`;
        }
        return val ?? '';
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
