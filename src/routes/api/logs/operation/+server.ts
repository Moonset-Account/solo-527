import { json, error } from '@sveltejs/kit';
import { getOperationLogs } from '$server/services/logs';

export async function GET({ url }) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
  const resourceType = url.searchParams.get('resourceType') || undefined;

  try {
    const result = await getOperationLogs(page, pageSize, resourceType);
    return json(result);
  } catch (e) {
    console.error('Error fetching operation logs:', e);
    error(500, '获取操作日志失败');
  }
}
