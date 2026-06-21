import { json, error } from '@sveltejs/kit';
import { getAnomalyById, updateAnomalyStatus } from '$server/services/anomalies';

export async function GET({ params }) {
  try {
    const anomaly = await getAnomalyById(params.id);
    if (!anomaly) {
      error(404, '异常记录不存在');
    }
    return json(anomaly);
  } catch (e) {
    console.error('Error fetching anomaly:', e);
    error(500, '获取异常详情失败');
  }
}

export async function PATCH({ params, request }) {
  try {
    const body = await request.json();
    const { status, resolvedBy } = body;
    const anomaly = await updateAnomalyStatus(params.id, status, resolvedBy);
    if (!anomaly) {
      error(404, '异常记录不存在');
    }
    return json(anomaly);
  } catch (e) {
    console.error('Error updating anomaly:', e);
    error(500, '更新异常记录失败');
  }
}
