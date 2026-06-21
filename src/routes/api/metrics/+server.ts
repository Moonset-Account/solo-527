import { json, error } from '@sveltejs/kit';
import { getMetricDefinitions, getMetricData, getMetricsTrend } from '$server/services/metrics';

export async function GET({ url }) {
  const dateFrom = url.searchParams.get('dateFrom') || undefined;
  const dateTo = url.searchParams.get('dateTo') || undefined;
  const metricKey = url.searchParams.get('metricKey') || undefined;
  const channel = url.searchParams.get('channel') || undefined;
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
  const trend = url.searchParams.get('trend');
  const days = parseInt(url.searchParams.get('days') || '30');

  try {
    if (trend === 'true' && metricKey) {
      const keys = metricKey.split(',');
      const data = await getMetricsTrend(keys, days);
      return json(data);
    }

    const result = await getMetricData({
      dateFrom,
      dateTo,
      metricKey,
      channel,
      page,
      pageSize
    });
    return json(result);
  } catch (e) {
    console.error('Error fetching metrics:', e);
    error(500, '获取指标数据失败');
  }
}
