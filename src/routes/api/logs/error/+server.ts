import { json, error } from '@sveltejs/kit';
import { getErrorLogs } from '$server/services/logs';

export async function GET({ url }) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
  const severity = url.searchParams.get('severity') || undefined;
  const type = url.searchParams.get('type') || undefined;

  try {
    const result = await getErrorLogs(page, pageSize, severity, type);
    return json(result);
  } catch (e) {
    console.error('Error fetching error logs:', e);
    error(500, '获取错误日志失败');
  }
}
