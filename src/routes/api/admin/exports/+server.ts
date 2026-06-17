import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { memoryStore, generateId } from '$lib/server/services/memoryStore';
import type { ExportTaskWithUser } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const userId = url.searchParams.get('userId') || undefined;
		let tasks = memoryStore.getExportTasks() as ExportTaskWithUser[];

		if (userId) {
			tasks = tasks.filter((t) => t.userId === userId);
		}

		tasks = [...tasks].sort(
			(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);

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

		const users = memoryStore.getUsers();
		const user = users.find((u) => u.id === userId);

		const task: ExportTaskWithUser = {
			id: generateId(),
			userId,
			userName: user?.name || '未知',
			exportType,
			filters: filters || {},
			status: 'processing',
			progress: 0,
			fileName: `${exportType}_${Date.now()}.${format || 'csv'}`,
			fileUrl: null,
			errorMessage: null,
			createdAt: new Date(),
			completedAt: null
		};

		const tasks = memoryStore.getExportTasks();
		tasks.unshift(task);
		memoryStore.setExportTasks(tasks);

		const logs = memoryStore.getLogs();
		logs.unshift({
			id: generateId(),
			userId,
			action: 'export_data',
			targetType: 'export',
			targetId: task.id,
			details: { exportType, format: format || 'csv' },
			createdAt: new Date(),
			userName: user?.name || '未知'
		});
		memoryStore.setLogs(logs);

		setTimeout(() => {
			const currentTasks = memoryStore.getExportTasks();
			const taskIndex = currentTasks.findIndex((t) => t.id === task.id);
			if (taskIndex === -1) return;

			currentTasks[taskIndex] = { ...currentTasks[taskIndex], progress: 30, status: 'processing' };
			memoryStore.setExportTasks(currentTasks);
		}, 500);

		setTimeout(() => {
			const currentTasks = memoryStore.getExportTasks();
			const taskIndex = currentTasks.findIndex((t) => t.id === task.id);
			if (taskIndex === -1) return;

			currentTasks[taskIndex] = { ...currentTasks[taskIndex], progress: 70, status: 'processing' };
			memoryStore.setExportTasks(currentTasks);
		}, 1200);

		setTimeout(() => {
			const currentTasks = memoryStore.getExportTasks();
			const taskIndex = currentTasks.findIndex((t) => t.id === task.id);
			if (taskIndex === -1) return;

			currentTasks[taskIndex] = {
				...currentTasks[taskIndex],
				progress: 100,
				status: 'completed',
				fileUrl: `/exports/${task.fileName}`,
				completedAt: new Date()
			};
			memoryStore.setExportTasks(currentTasks);
		}, 2000);

		return json({ success: true, data: task });
	} catch (err) {
		console.error('Create export task error:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, '创建导出任务失败');
	}
};
