import { json, error } from '@sveltejs/kit';
import { getAnomalies, getAnomalyById, getTodayAnomaliesCount } from '$server/services/anomalies';

export async function GET({ url }) {
  const dateFrom = url.searchParams.get('dateFrom') || undefined;
  const dateTo = url.searchParams.get('dateTo') || undefined;
  const severity = url.searchParams.get('severity') as any;
  const status = url.searchParams.get('status') as any;
  const metricKey = url.searchParams.get('metricKey') || undefined;
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
  const summary = url.searchParams.get('summary');

  try {
    if (summary === 'true') {
      const count = await getTodayAnomaliesCount();
      return json(count);
    }

    const result = await getAnomalies({
      dateFrom,
      dateTo,
      severity,
      status,
      metricKey,
      page,
      pageSize
    });
    return json(result);
  } catch (e) {
    console.error('Error fetching anomalies:', e);
    error(500, '获取异常记录失败');
  }
}
