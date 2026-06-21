import { mockMetricData, mockMetricDefinitions } from '$lib/mock/data';
import type { MetricData, MetricDefinition, PaginatedResult, MetricQueryParams } from '$types';

export async function getMetricDefinitions(): Promise<MetricDefinition[]> {
  return mockMetricDefinitions;
}

export async function getMetricDefinitionByKey(key: string): Promise<MetricDefinition | undefined> {
  return mockMetricDefinitions.find((d) => d.key === key);
}

export async function getMetricData(params: MetricQueryParams = {}): Promise<PaginatedResult<MetricData>> {
  let data = [...mockMetricData];

  if (params.dateFrom) {
    data = data.filter((d) => d.date >= params.dateFrom!);
  }
  if (params.dateTo) {
    data = data.filter((d) => d.date <= params.dateTo!);
  }
  if (params.metricKey) {
    data = data.filter((d) => d.metricKey === params.metricKey);
  }
  if (params.channel) {
    data = data.filter((d) => d.channel === params.channel);
  }

  data.sort((a, b) => b.date.localeCompare(a.date));

  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const total = data.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: data.slice(start, end),
    total,
    page,
    pageSize,
    totalPages
  };
}

export async function getMetricDataByDateRange(
  metricKey: string,
  dateFrom: string,
  dateTo: string
): Promise<MetricData[]> {
  const data = mockMetricData.filter(
    (d) => d.metricKey === metricKey && d.date >= dateFrom && d.date <= dateTo
  );
  data.sort((a, b) => a.date.localeCompare(b.date));
  return data;
}

export async function getLatestMetrics(date?: string): Promise<(MetricData & { metricName: string; unit: string })[]> {
  const targetDate = date || mockMetricData[0]?.date;
  const latestData = mockMetricData.filter((d) => d.date === targetDate);

  return latestData.map((d) => {
    const def = mockMetricDefinitions.find((def) => def.key === d.metricKey);
    return {
      ...d,
      metricName: def?.name || d.metricKey,
      unit: def?.unit || ''
    };
  });
}

export async function getMetricsTrend(
  metricKeys: string[],
  days: number
): Promise<{ date: string; [key: string]: string | number }[]> {
  const dates = [...new Set(mockMetricData.map((d) => d.date))].sort().slice(-days);

  return dates.map((date) => {
    const row: { date: string; [key: string]: string | number } = { date };
    for (const key of metricKeys) {
      const item = mockMetricData.find((d) => d.date === date && d.metricKey === key);
      row[key] = item?.value || 0;
    }
    return row;
  });
}
