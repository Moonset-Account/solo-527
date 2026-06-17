import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { memoryStore, paginate } from '$lib/server/services/memoryStore';
import type { SigninRecordWithDetails } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const userId = url.searchParams.get('userId');
		if (!userId) {
			throw error(400, '用户ID不能为空');
		}

		const page = parseInt(url.searchParams.get('page') || '1', 10);
		const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);
		const projectId = url.searchParams.get('projectId') || undefined;
		const status = url.searchParams.get('status') || undefined;

		let records = memoryStore.getSigninRecords() as SigninRecordWithDetails[];
		records = records.filter((r) => r.userId === userId);

		if (projectId) {
			records = records.filter((r) => r.projectId === projectId);
		}

		if (status && status !== 'all') {
			records = records.filter((r) => {
				if (status === 'completed') return !!r.signoutTime;
				if (status === 'in_progress') return !r.signoutTime;
				return true;
			});
		}

		records = [...records].sort(
			(a, b) => new Date(b.signinTime).getTime() - new Date(a.signinTime).getTime()
		);

		const { data, total } = paginate(records, page, pageSize);

		return json({
			success: true,
			data,
			total,
			page,
			pageSize,
			totalPages: Math.ceil(total / pageSize)
		});
	} catch (err) {
		console.error('Failed to fetch records:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, '获取服务记录失败');
	}
};
