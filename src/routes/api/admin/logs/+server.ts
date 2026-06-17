import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLogs } from '$lib/server/services/adminService';
import type { LogFilters, PaginationParams } from '$lib/types';

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

		const pagination: PaginationParams = { page, pageSize };
		const result = await getLogs(filters, pagination);

		return json({
			success: true,
			data: result.data,
			total: result.total,
			page,
			pageSize,
			totalPages: Math.ceil(result.total / pageSize)
		});
	} catch (err) {
		console.error('Failed to fetch logs:', err);
		throw error(500, '获取日志失败');
	}
};
