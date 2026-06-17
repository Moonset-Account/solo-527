import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { memoryStore, paginate, filterLogs } from '$lib/server/services/memoryStore';
import type { LogFilters } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const page = parseInt(url.searchParams.get('page') || '1', 10);
		const pageSize = parseInt(url.searchParams.get('pageSize') || '50', 10);

		const filters: LogFilters = {
			action: url.searchParams.get('action') || undefined,
			userId: url.searchParams.get('userId') || undefined,
			targetType: url.searchParams.get('targetType') || undefined,
			startDate: url.searchParams.get('startDate') || undefined,
			endDate: url.searchParams.get('endDate') || undefined
		};

		let logs = memoryStore.getLogs();
		logs = filterLogs(logs, filters);
		logs = [...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		const { data, total } = paginate(logs, page, pageSize);

		return json({
			success: true,
			data,
			total,
			page,
			pageSize,
			totalPages: Math.ceil(total / pageSize)
		});
	} catch (err) {
		console.error('Failed to fetch logs:', err);
		throw error(500, '获取日志失败');
	}
};
