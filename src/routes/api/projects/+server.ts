import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { memoryStore, paginate, filterProjects } from '$lib/server/services/memoryStore';
import type { ProjectWithStats } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const page = parseInt(url.searchParams.get('page') || '1', 10);
		const pageSize = parseInt(url.searchParams.get('pageSize') || '12', 10);
		const sortField = url.searchParams.get('sortField') || 'createdAt';
		const sortOrder = (url.searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

		const statusParam = url.searchParams.get('status');
		const categoryParam = url.searchParams.get('category');

		const filters: any = {
			status: statusParam ? statusParam.split(',') : undefined,
			category: categoryParam ? categoryParam.split(',') : undefined,
			keyword: url.searchParams.get('keyword') || undefined
		};

		let projects = memoryStore.getProjects() as ProjectWithStats[];
		projects = filterProjects(projects, filters);

		if (sortField && sortOrder) {
			projects = [...projects].sort((a: any, b: any) => {
				const aVal = a[sortField];
				const bVal = b[sortField];
				if (typeof aVal === 'string') {
					return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
				}
				if (aVal instanceof Date) {
					return sortOrder === 'asc' ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
				}
				return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
			});
		}

		const categories = [...new Set(projects.map((p) => p.category))];
		const { data, total } = paginate(projects, page, pageSize);

		return json({
			success: true,
			data,
			total,
			page,
			pageSize,
			totalPages: Math.ceil(total / pageSize),
			categories
		});
	} catch (err) {
		console.error('Failed to fetch projects:', err);
		throw error(500, '获取项目列表失败');
	}
};
