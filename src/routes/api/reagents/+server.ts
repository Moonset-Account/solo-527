import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getReagents, getReagentById, createReagent, updateReagent, deleteReagent } from '$server/services/reagent';
import { mockReagents } from '$server/mockData';
import type { Reagent } from '$types';

let useMock = true;

function setUseMock() {
	useMock = process.env.USE_MOCK === 'true' || !process.env.DATABASE_URL;
}

setUseMock();

export const GET: RequestHandler = async ({ url }) => {
	setUseMock();

	const category = url.searchParams.get('category');
	const hazardLevel = url.searchParams.get('hazardLevel');
	const search = url.searchParams.get('search');
	const page = parseInt(url.searchParams.get('page') || '1');
	const pageSize = parseInt(url.searchParams.get('pageSize') || '50');

	try {
		if (useMock) {
			let filtered = [...mockReagents];
			if (category) filtered = filtered.filter((r) => r.category === category);
			if (hazardLevel) filtered = filtered.filter((r) => r.hazardLevel === hazardLevel);
			if (search) {
				const lowerSearch = search.toLowerCase();
				filtered = filtered.filter(
					(r) =>
						r.name.toLowerCase().includes(lowerSearch) ||
						(r.casNumber && r.casNumber.toLowerCase().includes(lowerSearch))
				);
			}
			filtered.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
			const start = (page - 1) * pageSize;
			const end = start + pageSize;
			return json({
				data: filtered.slice(start, end),
				total: filtered.length
			});
		}

		const result = await getReagents(
			{
				category: category as any,
				hazardLevel: hazardLevel as any,
				search: search || undefined
			},
			{ page, pageSize }
		);
		return json(result);
	} catch (e) {
		console.error('Failed to get reagents:', e);
		return json(
			{
				data: mockReagents,
				total: mockReagents.length
			},
			{ status: 200 }
		);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	setUseMock();

	try {
		const body = (await request.json()) as Omit<Reagent, 'id'>;

		if (useMock) {
			const newReagent: Reagent = {
				...body,
				id: `reagent-${Date.now()}`
			};
			mockReagents.push(newReagent);
			return json(newReagent, { status: 201 });
		}

		const result = await createReagent(body);
		return json(result, { status: 201 });
	} catch (e) {
		console.error('Failed to create reagent:', e);
		throw error(500, '创建试剂失败');
	}
};

export const PATCH: RequestHandler = async ({ request, url }) => {
	setUseMock();

	const id = url.searchParams.get('id');

	if (!id) {
		throw error(400, '缺少试剂ID');
	}

	try {
		const body = await request.json();

		if (useMock) {
			const idx = mockReagents.findIndex((r) => r.id === id);
			if (idx < 0) {
				throw error(404, '试剂不存在');
			}

			mockReagents[idx] = { ...mockReagents[idx], ...body };
			return json(mockReagents[idx]);
		}

		const result = await updateReagent(id, body);
		return json(result);
	} catch (e) {
		console.error('Failed to update reagent:', e);
		if (e instanceof Error && e.message.includes('404')) {
			throw error(404, '试剂不存在');
		}
		throw error(500, '更新试剂失败');
	}
};

export const DELETE: RequestHandler = async ({ url }) => {
	setUseMock();

	const id = url.searchParams.get('id');

	if (!id) {
		throw error(400, '缺少试剂ID');
	}

	try {
		if (useMock) {
			const idx = mockReagents.findIndex((r) => r.id === id);
			if (idx < 0) {
				throw error(404, '试剂不存在');
			}
			mockReagents.splice(idx, 1);
			return json({ success: true });
		}

		const result = await deleteReagent(id);
		if (!result) {
			throw error(404, '试剂不存在');
		}
		return json({ success: true });
	} catch (e) {
		console.error('Failed to delete reagent:', e);
		if (e instanceof Error && e.message.includes('404')) {
			throw error(404, '试剂不存在');
		}
		throw error(500, '删除试剂失败');
	}
};
