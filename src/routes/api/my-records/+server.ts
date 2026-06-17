import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserSigninRecords } from '$lib/server/services/registrationService';
import type { ServiceRecordFilters, PaginationParams } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const userId = url.searchParams.get('userId');
		if (!userId) {
			throw error(400, '用户ID不能为空');
		}

		const page = parseInt(url.searchParams.get('page') || '1', 10);
		const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);

		const filters: ServiceRecordFilters = {
			projectId: url.searchParams.get('projectId') || undefined,
			startDate: url.searchParams.get('startDate') || undefined,
			endDate: url.searchParams.get('endDate') || undefined,
			status: url.searchParams.getAll('status') as ServiceRecordFilters['status']
		};

		const pagination: PaginationParams = { page, pageSize };
		const result = await getUserSigninRecords(userId, filters, pagination);

		return json({
			success: true,
			data: result.data,
			total: result.total,
			page,
			pageSize,
			totalPages: Math.ceil(result.total / pageSize)
		});
	} catch (err) {
		console.error('Failed to fetch records:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, '获取服务记录失败');
	}
};
