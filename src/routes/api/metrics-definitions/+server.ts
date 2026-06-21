import { json, error } from '@sveltejs/kit';
import { getMetricDefinitions, getMetricDefinitionByKey } from '$server/services/metrics';

export async function GET() {
  try {
    const definitions = await getMetricDefinitions();
    return json(definitions);
  } catch (e) {
    console.error('Error fetching metric definitions:', e);
    error(500, '获取指标定义失败');
  }
}
