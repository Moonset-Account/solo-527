import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getExperiments, getExperimentById, createExperiment, deleteExperiment } from '$server/services/experiment';
import { mockExperiments, mockCompliance, mockUsers } from '$server/mockData';
import type { Experiment } from '$types';

let useMock = true;

function setUseMock() {
	useMock = process.env.USE_MOCK === 'true' || !process.env.DATABASE_URL;
}

setUseMock();

export const GET: RequestHandler = async ({ url }) => {
	setUseMock();

	const userId = url.searchParams.get('userId');
	const page = parseInt(url.searchParams.get('page') || '1');
	const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

	try {
		if (useMock) {
			let filtered = [...mockExperiments];
			if (userId) filtered = filtered.filter((e) => e.userId === userId);
			filtered.sort(
				(a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
			);
			const start = (page - 1) * pageSize;
			const end = start + pageSize;
			return json({
				data: filtered.slice(start, end),
				total: filtered.length
			});
		}

		const result = await getExperiments(
			{ userId: userId || undefined },
			{ page, pageSize }
		);
		return json(result);
	} catch (e) {
		console.error('Failed to get experiments:', e);
		return json(
			{
				data: mockExperiments,
				total: mockExperiments.length
			},
			{ status: 200 }
		);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	setUseMock();

	try {
		const body = (await request.json()) as Omit<
			Experiment,
			'id' | 'archivedAt' | 'complianceRecordId'
		>;

		if (useMock) {
			const newExperiment: Experiment = {
				...body,
				id: `exp-${Date.now()}`,
				archivedAt: new Date()
			};
			mockExperiments.push(newExperiment);
			const user = mockUsers.find((u) => u.id === body.userId);
			const now = new Date();
			mockCompliance.push({
				id: `comp-${Date.now()}`,
				type: 'experiment',
				referenceId: newExperiment.id,
				status: 'completed',
				operator: user?.name || '未知用户',
				operatorId: body.userId,
				details: `归档实验数据: ${body.title}`,
				createdAt: now,
				processedAt: now
			});
			return json(newExperiment, { status: 201 });
		}

		const result = await createExperiment(body);
		return json(result, { status: 201 });
	} catch (e) {
		console.error('Failed to create experiment:', e);
		throw error(500, '创建实验数据失败');
	}
};

export const DELETE: RequestHandler = async ({ url }) => {
	setUseMock();

	const id = url.searchParams.get('id');

	if (!id) {
		throw error(400, '缺少实验数据ID');
	}

	try {
		if (useMock) {
			const idx = mockExperiments.findIndex((e) => e.id === id);
			if (idx < 0) {
				throw error(404, '实验数据不存在');
			}
			mockExperiments.splice(idx, 1);
			return json({ success: true });
		}

		const result = await deleteExperiment(id);
		if (!result) {
			throw error(404, '实验数据不存在');
		}
		return json({ success: true });
	} catch (e) {
		console.error('Failed to delete experiment:', e);
		if (e instanceof Error && e.message.includes('404')) {
			throw error(404, '实验数据不存在');
		}
		throw error(500, '删除实验数据失败');
	}
};
