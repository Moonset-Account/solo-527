import { json, error } from '@sveltejs/kit';
import { getExportTasks, createExportTask } from '$server/services/logs';

export async function GET({ url }) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

  try {
    const result = await getExportTasks(page, pageSize);
    return json(result);
  } catch (e) {
    console.error('Error fetching export tasks:', e);
    error(500, '获取导出任务失败');
  }
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { type, format, params, createdBy } = body;
    const task = await createExportTask(type, format, params, createdBy || 'system');
    return json(task, { status: 201 });
  } catch (e) {
    console.error('Error creating export task:', e);
    error(500, '创建导出任务失败');
  }
}
