import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getExportTasks,
	createExportTask,
	logOperation,
	generateExportData,
	updateExportTaskStatus
} from '$lib/server/services/adminService';
import type { NewExportTask } from '$lib/server/db/schema';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const userId = url.searchParams.get('userId') || undefined;
		const tasks = await getExportTasks(userId);
		return json({ success: true, data: tasks });
	} catch (err) {
		console.error('Failed to fetch export tasks:', err);
		throw error(500, '获取导出任务失败');
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { userId, exportType, filters, format } = body;

		if (!userId || !exportType) {
			throw error(400, '缺少必填参数');
		}

		const task = await createExportTask({
			userId,
			exportType,
			filters: filters as NewExportTask['filters'],
			status: 'processing',
			fileName: `${exportType}_${Date.now()}.${format || 'csv'}`
		} as NewExportTask);

		await logOperation(userId, 'export_data', 'export', task.id);

		setTimeout(async () => {
			try {
				await updateExportTaskStatus(task.id, 'processing', 30);
				const data = await generateExportData(exportType, filters || {});
				await updateExportTaskStatus(task.id, 'processing', 70);
				const csv = data.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
				const fileUrl = `/exports/${task.fileName}`;
				await updateExportTaskStatus(task.id, 'completed', 100, fileUrl);
			} catch (err) {
				console.error('Export processing error:', err);
				await updateExportTaskStatus(task.id, 'failed', 0, undefined, '导出处理失败');
			}
		}, 100);

		return json({ success: true, data: task });
	} catch (err) {
		console.error('Create export task error:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, '创建导出任务失败');
	}
};
