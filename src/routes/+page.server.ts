import { getLatestMetrics, getMetricsTrend } from '$server/services/metrics';
import { getTodayAnomaliesCount, getAnomalies } from '$server/services/anomalies';
import { getDateRange } from '$utils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const latestMetrics = await getLatestMetrics();
  const anomalySummary = await getTodayAnomaliesCount();
  const anomaliesResult = await getAnomalies({ page: 1, pageSize: 5 });

  const { start: dateFrom } = getDateRange(30);
  
  const metricsWithTrend = await Promise.all(
    latestMetrics.map(async (m) => {
      const trend = await getMetricsTrend([m.metricKey], 14);
      const values = trend.map((t) => t[m.metricKey] as number);
      const max = Math.max(...values, 1);
      const trendData = values.map((v) => v / max);
      
      return {
        metricKey: m.metricKey,
        metricName: m.metricName,
        unit: m.unit,
        value: m.value,
        dod: m.dod || 0,
        wow: m.wow || 0,
        trendData
      };
    })
  );

  return {
    metrics: metricsWithTrend,
    anomalySummary,
    recentAnomalies: anomaliesResult.data
  };
};
