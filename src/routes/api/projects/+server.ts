import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProjects, getProjectCategories } from '$lib/server/services/projectService';
import type { ProjectFilters, PaginationParams, SortParams } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const page = parseInt(url.searchParams.get('page') || '1', 10);
		const pageSize = parseInt(url.searchParams.get('pageSize') || '12', 10);
		const sortField = url.searchParams.get('sortField') || 'createdAt';
		const sortOrder = (url.searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

		const filters: ProjectFilters = {
			status: url.searchParams.getAll('status') as ProjectFilters['status'],
			category: url.searchParams.getAll('category') as ProjectFilters['category'],
			startDate: url.searchParams.get('startDate') || undefined,
			endDate: url.searchParams.get('endDate') || undefined,
			keyword: url.searchParams.get('keyword') || undefined
		};

		const pagination: PaginationParams = { page, pageSize };
		const sort: SortParams = { field: sortField, order: sortOrder };

		const result = await getProjects(filters, pagination, sort);
		const categories = await getProjectCategories();

		return json({
			success: true,
			data: result.data,
			total: result.total,
			page,
			pageSize,
			totalPages: Math.ceil(result.total / pageSize),
			categories
		});
	} catch (err) {
		console.error('Failed to fetch projects:', err);
		throw error(500, '获取项目列表失败');
	}
};
